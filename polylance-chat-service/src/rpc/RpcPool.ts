import { ethers } from "ethers";

export interface ProviderHealth {
  id: string;
  url: string;
  isHealthy: boolean;
  circuitBreakerState: "CLOSED" | "OPEN" | "HALF_OPEN";
  failureCount: number;
  lastFailureTime: number;
  latencyMs: number;
  blockHeight: number;
  blockLag: number;
  errorRate: number; // percentage (0 - 100)
  totalRequests: number;
  failedRequests: number;
  maxBlockRange?: number;
}

export function isClientSideRequestError(err: any): boolean {
  if (!err) return false;
  const code = err?.code ?? err?.error?.code ?? err?.info?.error?.code;
  const msg = (
    (err?.message || "") +
    " " +
    (err?.error?.message || "") +
    " " +
    (err?.info?.error?.message || "") +
    " " +
    (typeof err?.shortMessage === "string" ? err.shortMessage : "")
  ).toLowerCase();

  // -32602: Invalid params (e.g. block range too large, negative blocks)
  // -32701: Missing address
  if (code === -32602 || code === -32701) return true;

  if (
    msg.includes("please specify an address") ||
    msg.includes("limited to") ||
    msg.includes("block range") ||
    msg.includes("invalid params") ||
    msg.includes("invalid argument") ||
    msg.includes("exceed max block range") ||
    msg.includes("query exceeds max results") ||
    msg.includes("too many results") ||
    msg.includes("eth_getlogs")
  ) {
    if (msg.includes("50 blocks range") || msg.includes("address in your request") || msg.includes("invalid params")) {
      return true;
    }
  }

  const status = err?.status ?? err?.statusCode;
  if (status === 400) return true;

  return false;
}

export interface RpcPoolConfig {
  chainId: number;
  timeoutMs?: number;
  maxRetries?: number;
  circuitBreakerThreshold?: number;
  circuitBreakerCooldownMs?: number;
  blockLagTolerance?: number;
  cacheTtlMs?: number;
  defaultMaxBlockRange?: number;
}

interface CacheItem<T> {
  data: T;
  expiresAt: number;
}

export class RpcPool {
  private providers: {
    id: string;
    url: string;
    provider: ethers.JsonRpcProvider;
    isHealthy: boolean;
    circuitState: "CLOSED" | "OPEN" | "HALF_OPEN";
    failureCount: number;
    lastFailureTime: number;
    latencyMs: number;
    blockHeight: number;
    totalRequests: number;
    failedRequests: number;
    maxBlockRange: number;
  }[] = [];

  private config: Required<RpcPoolConfig>;
  private cache: Map<string, CacheItem<any>> = new Map();
  private inFlightRequests: Map<string, Promise<any>> = new Map();
  private monitorInterval: NodeJS.Timeout | null = null;

  constructor(urls: { id: string; url: string }[], config: RpcPoolConfig) {
    this.config = {
      chainId: config.chainId,
      timeoutMs: config.timeoutMs ?? 8000,
      maxRetries: config.maxRetries ?? 3,
      circuitBreakerThreshold: config.circuitBreakerThreshold ?? 3,
      circuitBreakerCooldownMs: config.circuitBreakerCooldownMs ?? 30000,
      blockLagTolerance: config.blockLagTolerance ?? 5,
      cacheTtlMs: config.cacheTtlMs ?? 10000,
      defaultMaxBlockRange: config.defaultMaxBlockRange ?? 50,
    };

    if (urls.length === 0) {
      throw new Error("RpcPool requires at least one provider endpoint.");
    }

    this.providers = urls.map((u) => {
      const p = new ethers.JsonRpcProvider(u.url, this.config.chainId, {
        staticNetwork: true,
      });
      return {
        id: u.id,
        url: u.url,
        provider: p,
        isHealthy: true,
        circuitState: "CLOSED" as const,
        failureCount: 0,
        lastFailureTime: 0,
        latencyMs: 0,
        blockHeight: 0,
        totalRequests: 0,
        failedRequests: 0,
        maxBlockRange: this.config.defaultMaxBlockRange,
      };
    });
  }

  public async start(): Promise<void> {
    await this.validateAllProviders();
    // Run periodic block height & health monitor every 15s
    if (!this.monitorInterval) {
      this.monitorInterval = setInterval(() => {
        this.checkProvidersHealth().catch(() => {});
      }, 15000);
    }
  }

  public stop(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
  }

  /**
   * Validates that all connected providers support the specified chainId
   */
  public async validateAllProviders(): Promise<void> {
    for (const p of this.providers) {
      try {
        const start = Date.now();
        const network = await this.withTimeout(p.provider.getNetwork(), this.config.timeoutMs);
        p.latencyMs = Date.now() - start;
        if (Number(network.chainId) !== this.config.chainId) {
          p.isHealthy = false;
          p.circuitState = "OPEN";
          console.error(`[RpcPool] Provider ${p.id} rejected: expected chainId ${this.config.chainId}, got ${network.chainId}`);
        } else {
          p.isHealthy = true;
          p.circuitState = "CLOSED";
          p.failureCount = 0;
        }
      } catch (err: any) {
        p.isHealthy = false;
        p.circuitState = "OPEN";
        p.failureCount++;
        p.lastFailureTime = Date.now();
        console.warn(`[RpcPool] Initial connection probe failed for ${p.id} (${p.url}):`, err?.message || err);
      }
    }
    await this.checkProvidersHealth();
  }

  /**
   * Health monitor: updates block height, latency, and evaluates circuit breaker state
   */
  public async checkProvidersHealth(): Promise<void> {
    const now = Date.now();
    let maxBlock = 0;

    await Promise.all(
      this.providers.map(async (p) => {
        // Probe half-open if cooldown period elapsed
        if (p.circuitState === "OPEN" && now - p.lastFailureTime >= this.config.circuitBreakerCooldownMs) {
          p.circuitState = "HALF_OPEN";
        }

        try {
          const start = Date.now();
          const block = await this.withTimeout(p.provider.getBlockNumber(), this.config.timeoutMs);
          p.latencyMs = Date.now() - start;
          p.blockHeight = block;
          if (block > maxBlock) maxBlock = block;

          if (p.circuitState === "HALF_OPEN" || p.circuitState === "OPEN") {
            p.circuitState = "CLOSED";
            p.failureCount = 0;
            p.isHealthy = true;
            console.log(`[RpcPool] Provider ${p.id} recovered and closed circuit breaker.`);
          }
        } catch (err) {
          p.failureCount++;
          p.lastFailureTime = now;
          if (p.failureCount >= this.config.circuitBreakerThreshold) {
            p.circuitState = "OPEN";
            p.isHealthy = false;
          }
        }
      })
    );

    // Block-lag evaluation: deprioritize providers lagging behind maxBlock
    for (const p of this.providers) {
      if (maxBlock > 0 && p.blockHeight > 0) {
        const lag = maxBlock - p.blockHeight;
        if (lag > this.config.blockLagTolerance && p.isHealthy) {
          console.warn(`[RpcPool] Provider ${p.id} is lagging by ${lag} blocks (current: ${p.blockHeight}, max: ${maxBlock})`);
        }
      }
    }
  }

  /**
   * Gets ordered list of healthy providers, prioritized by circuit state, block-lag, and latency
   */
  public getEligibleProviders(): typeof this.providers {
    const now = Date.now();
    let maxBlock = 0;
    for (const p of this.providers) {
      if (p.blockHeight > maxBlock) maxBlock = p.blockHeight;
    }

    return this.providers
      .filter((p) => {
        if (p.circuitState === "CLOSED") return true;
        if (p.circuitState === "HALF_OPEN") return true;
        if (p.circuitState === "OPEN" && now - p.lastFailureTime >= this.config.circuitBreakerCooldownMs) {
          p.circuitState = "HALF_OPEN";
          return true;
        }
        return false;
      })
      .sort((a, b) => {
        // Closed circuits first
        if (a.circuitState === "CLOSED" && b.circuitState !== "CLOSED") return -1;
        if (b.circuitState === "CLOSED" && a.circuitState !== "CLOSED") return 1;

        // Least block lag
        const lagA = maxBlock > 0 && a.blockHeight > 0 ? maxBlock - a.blockHeight : 0;
        const lagB = maxBlock > 0 && b.blockHeight > 0 ? maxBlock - b.blockHeight : 0;
        if (lagA !== lagB) return lagA - lagB;

        // Lowest latency
        return a.latencyMs - b.latencyMs;
      });
  }

  /**
   * Executes a standard read call with automatic failover, exponential backoff, and in-flight deduplication
   */
  public async execute<T>(
    operation: (provider: ethers.JsonRpcProvider) => Promise<T>,
    options?: {
      cacheKey?: string;
      cacheTtlMs?: number;
      isCritical?: boolean;
    }
  ): Promise<T> {
    const cacheKey = options?.cacheKey;
    const cacheTtl = options?.cacheTtlMs ?? this.config.cacheTtlMs;

    // 1. Check in-memory cache
    if (cacheKey) {
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.data as T;
      }
    }

    // 2. Check in-flight deduplication
    if (cacheKey) {
      const inFlight = this.inFlightRequests.get(cacheKey);
      if (inFlight) {
        return inFlight as Promise<T>;
      }
    }

    const execPromise = (async () => {
      let lastError: any = null;
      const eligible = this.getEligibleProviders();

      if (eligible.length === 0) {
        // Fallback: try any provider if all circuits are open
        const fallback = this.providers[0];
        try {
          return await this.withTimeout(operation(fallback.provider), this.config.timeoutMs);
        } catch (err) {
          throw new Error("All RPC providers in pool are currently unavailable.");
        }
      }

      for (const p of eligible) {
        let attempt = 0;
        let isClientError = false;
        while (attempt < this.config.maxRetries) {
          attempt++;
          p.totalRequests++;
          try {
            const start = Date.now();
            const result = await this.withTimeout(operation(p.provider), this.config.timeoutMs);
            p.latencyMs = Date.now() - start;
            p.failureCount = 0;
            p.circuitState = "CLOSED";
            p.isHealthy = true;

            if (cacheKey) {
              this.cache.set(cacheKey, { data: result, expiresAt: Date.now() + cacheTtl });
            }
            return result;
          } catch (err: any) {
            p.failedRequests++;
            lastError = err;

            // Classify error: client-side bad request vs provider/network failure
            if (isClientSideRequestError(err)) {
              isClientError = true;
              console.warn(
                `[RpcPool] Client request error on provider ${p.id} (${err?.code ?? 'N/A'}): ${err?.message?.slice(0, 160)}`
              );
              break; // Do not retry client-side errors
            }

            const isRateLimit = err?.status === 429 || err?.message?.includes("429") || err?.code === "BAD_DATA";
            const isTimeout = err?.message?.includes("timeout");
            const isServerErr = err?.status >= 500;

            if (isRateLimit || isTimeout || isServerErr) {
              // Exponential backoff with jitter
              const backoff = Math.min(500 * Math.pow(2, attempt) + Math.random() * 200, 3000);
              await new Promise((r) => setTimeout(r, backoff));
            } else {
              // Non-retriable execution error (e.g. execution reverted / contract revert)
              break;
            }
          }
        }

        if (isClientError) {
          // Do NOT trip circuit breaker on client-side errors!
          // And do NOT repeat identical bad request across all providers.
          throw lastError;
        }

        // Provider failed all retries — increment failure count and evaluate circuit breaker
        p.failureCount++;
        p.lastFailureTime = Date.now();
        if (p.failureCount >= this.config.circuitBreakerThreshold) {
          p.circuitState = "OPEN";
          p.isHealthy = false;
          console.warn(`[RpcPool] Circuit breaker opened for provider ${p.id} after repeated failures.`);
        }
      }

      throw lastError || new Error("Failed to execute RPC call across all providers.");
    })();

    if (cacheKey) {
      this.inFlightRequests.set(cacheKey, execPromise);
      execPromise.finally(() => this.inFlightRequests.delete(cacheKey));
    }

    return execPromise;
  }

  /**
   * Quorum Read: queries multiple independent providers for consensus.
   * If providers disagree, returns { quorumReached: false, value: null }.
   */
  public async executeQuorum<T>(
    operation: (provider: ethers.JsonRpcProvider) => Promise<T>,
    comparator?: (a: T, b: T) => boolean,
    requiredAgreements: number = 2
  ): Promise<{ quorumReached: boolean; value: T | null; responses: { providerId: string; value?: T; error?: string }[] }> {
    const eligible = this.getEligibleProviders();
    const targetCount = Math.min(requiredAgreements, eligible.length);

    if (eligible.length === 0) {
      return { quorumReached: false, value: null, responses: [] };
    }

    // Execute concurrently across top eligible providers
    const providersToQuery = eligible.slice(0, Math.max(targetCount, 2));
    const results = await Promise.allSettled(
      providersToQuery.map(async (p) => {
        const val = await this.withTimeout(operation(p.provider), this.config.timeoutMs);
        return { providerId: p.id, value: val };
      })
    );

    const responses: { providerId: string; value?: T; error?: string }[] = [];
    const successfulValues: T[] = [];

    results.forEach((r, idx) => {
      const p = providersToQuery[idx];
      if (r.status === "fulfilled") {
        responses.push({ providerId: p.id, value: r.value.value });
        successfulValues.push(r.value.value);
      } else {
        responses.push({ providerId: p.id, error: r.reason?.message || "Failed" });
      }
    });

    if (successfulValues.length < targetCount) {
      return { quorumReached: false, value: null, responses };
    }

    const defaultComparator = (a: any, b: any) => {
      if (typeof a === "bigint" && typeof b === "bigint") return a === b;
      return JSON.stringify(a) === JSON.stringify(b);
    };
    const comp = comparator || defaultComparator;

    // Check if at least targetCount values agree
    for (let i = 0; i < successfulValues.length; i++) {
      let matchCount = 1;
      for (let j = i + 1; j < successfulValues.length; j++) {
        if (comp(successfulValues[i], successfulValues[j])) {
          matchCount++;
          if (matchCount >= targetCount) {
            return { quorumReached: true, value: successfulValues[i], responses };
          }
        }
      }
    }

    console.warn("[RpcPool] Quorum disagreement across RPC providers:", responses);
    return { quorumReached: false, value: null, responses };
  }

  /**
   * Health report for admin / monitoring endpoint
   */
  public getHealthReport(): ProviderHealth[] {
    let maxBlock = 0;
    for (const p of this.providers) {
      if (p.blockHeight > maxBlock) maxBlock = p.blockHeight;
    }

    return this.providers.map((p) => {
      const errRate = p.totalRequests > 0 ? (p.failedRequests / p.totalRequests) * 100 : 0;
      return {
        id: p.id,
        url: this.sanitizeUrl(p.url),
        isHealthy: p.isHealthy,
        circuitBreakerState: p.circuitState,
        failureCount: p.failureCount,
        lastFailureTime: p.lastFailureTime,
        latencyMs: p.latencyMs,
        blockHeight: p.blockHeight,
        blockLag: maxBlock > 0 && p.blockHeight > 0 ? maxBlock - p.blockHeight : 0,
        errorRate: Math.round(errRate * 10) / 10,
        totalRequests: p.totalRequests,
        failedRequests: p.failedRequests,
        maxBlockRange: p.maxBlockRange,
      };
    });
  }

  public getLearnedBlockRange(providerId?: string): number {
    if (providerId) {
      const p = this.providers.find((item) => item.id === providerId);
      if (p) return p.maxBlockRange;
    }
    return Math.min(...this.providers.map((p) => p.maxBlockRange));
  }

  public updateLearnedBlockRange(providerId: string, limit: number): void {
    const p = this.providers.find((item) => item.id === providerId);
    if (p) {
      p.maxBlockRange = Math.max(5, limit);
      console.log(`[RpcPool] Updated learned maxBlockRange for ${p.id} to ${p.maxBlockRange}`);
    }
  }

  /**
   * Public sanitized health summary for frontend status banner
   */
  public getPublicHealthSummary(): {
    networkStatus: "HEALTHY" | "DEGRADED" | "DOWN";
    activeProviders: number;
    totalProviders: number;
    blockHeight: number;
  } {
    const healthy = this.providers.filter((p) => p.isHealthy);
    let maxBlock = 0;
    for (const p of this.providers) {
      if (p.blockHeight > maxBlock) maxBlock = p.blockHeight;
    }

    let status: "HEALTHY" | "DEGRADED" | "DOWN" = "HEALTHY";
    if (healthy.length === 0) status = "DOWN";
    else if (healthy.length < this.providers.length) status = "DEGRADED";

    return {
      networkStatus: status,
      activeProviders: healthy.length,
      totalProviders: this.providers.length,
      blockHeight: maxBlock,
    };
  }

  public getHealth(): {
    healthyProviders: number;
    totalProviders: number;
    currentBlock: number;
    providers: ProviderHealth[];
  } {
    const report = this.getHealthReport();
    let maxBlock = 0;
    let healthyCount = 0;
    for (const p of report) {
      if (p.blockHeight > maxBlock) maxBlock = p.blockHeight;
      if (p.isHealthy) healthyCount++;
    }
    return {
      healthyProviders: healthyCount,
      totalProviders: report.length,
      currentBlock: maxBlock,
      providers: report,
    };
  }

  private sanitizeUrl(url: string): string {
    try {
      const u = new URL(url);
      return `${u.protocol}//${u.host}`;
    } catch {
      return url.split("?")[0];
    }
  }

  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`RPC request timed out after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  }

  /**
   * Reads account balances for native POL, USDC, and USDT with failover & caching
   */
  public async getBalances(
    walletAddress: string,
    usdcAddress?: string,
    usdtAddress?: string
  ): Promise<{ nativePOL: bigint; usdc: bigint; usdt: bigint }> {
    const cacheKey = `balances:${walletAddress.toLowerCase()}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const ERC20_BAL_ABI = ["function balanceOf(address owner) external view returns (uint256)"];

    const balances = await this.execute(async (provider) => {
      const polBalPromise = provider.getBalance(walletAddress);
      const usdcPromise = usdcAddress && ethers.isAddress(usdcAddress)
        ? new ethers.Contract(usdcAddress, ERC20_BAL_ABI, provider).balanceOf(walletAddress).catch(() => 0n)
        : Promise.resolve(0n);
      const usdtPromise = usdtAddress && ethers.isAddress(usdtAddress)
        ? new ethers.Contract(usdtAddress, ERC20_BAL_ABI, provider).balanceOf(walletAddress).catch(() => 0n)
        : Promise.resolve(0n);

      const [polBal, usdcBal, usdtBal] = await Promise.all([polBalPromise, usdcPromise, usdtPromise]);
      return {
        nativePOL: polBal,
        usdc: BigInt(usdcBal),
        usdt: BigInt(usdtBal),
      };
    });

    this.cache.set(cacheKey, { data: balances, expiresAt: Date.now() + 10000 }); // 10s cache
    return balances;
  }
}

/**
 * Factory creating default RpcPool from environment variables
 */
export function createDefaultRpcPool(): RpcPool {
  const chainId = parseInt(process.env.CHAIN_ID || "137", 10);
  const isAmoy = chainId === 80002;

  const urls: { id: string; url: string }[] = [];

  const primary = (process.env.RPC_URL_PRIMARY || "").trim();
  const secondary = (process.env.RPC_URL_SECONDARY || "").trim();
  const fallback = (process.env.RPC_URL_FALLBACK || "").trim();

  if (primary) urls.push({ id: "primary", url: primary });
  if (secondary) urls.push({ id: "secondary", url: secondary });
  if (fallback) urls.push({ id: "fallback", url: fallback });

  if (urls.length === 0) {
    if (isAmoy) {
      urls.push({ id: "amoy-bor", url: "https://polygon-amoy-bor-rpc.publicnode.com" });
      urls.push({ id: "amoy-tech", url: "https://rpc-amoy.polygon.technology" });
    } else {
      urls.push({ id: "polygon-drpc", url: "https://polygon.drpc.org" });
      urls.push({ id: "polygon-publicnode", url: "https://polygon-bor-rpc.publicnode.com" });
      urls.push({ id: "polygon-1rpc", url: "https://1rpc.io/matic" });
    }
  }

  return new RpcPool(urls, { chainId });
}
