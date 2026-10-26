import { describe, it, expect } from "vitest";
import { RpcPool } from "../rpc/RpcPool.js";

describe("RpcPool Resiliency & Quorum Engine", () => {
  const mockEndpoints = [
    { id: "provider-primary", url: "https://rpc1.mock.polylance" },
    { id: "provider-secondary", url: "https://rpc2.mock.polylance" },
    { id: "provider-tertiary", url: "https://rpc3.mock.polylance" },
  ];

  it("initializes providers with configured chainId", () => {
    const pool = new RpcPool(mockEndpoints, {
      chainId: 137,
      circuitBreakerThreshold: 3,
      circuitBreakerCooldownMs: 1000,
    });

    const report = pool.getHealthReport();
    expect(report.length).toBe(3);
    expect(report[0].id).toBe("provider-primary");
    expect(report[0].circuitBreakerState).toBe("CLOSED");
    expect(report[0].isHealthy).toBe(true);
  });

  it("fails over to secondary provider when primary throws error", async () => {
    const pool = new RpcPool(mockEndpoints, {
      chainId: 137,
      maxRetries: 1, // 1 retry per provider for deterministic failover test
      circuitBreakerThreshold: 3,
      circuitBreakerCooldownMs: 1000,
    });

    let primaryAttempts = 0;
    let secondaryAttempts = 0;

    const result = await pool.execute(async (provider) => {
      const url = (provider as any)._getConnection?.()?.url;
      if (url === "https://rpc1.mock.polylance") {
        primaryAttempts++;
        throw new Error("RPC Node Error 503");
      }
      secondaryAttempts++;
      return 12345678;
    });

    expect(result).toBe(12345678);
    expect(primaryAttempts).toBe(1);
    expect(secondaryAttempts).toBe(1);

    const report = pool.getHealthReport();
    expect(report[0].failureCount).toBe(1);
    expect(report[1].failureCount).toBe(0);
  });

  it("trips circuit breaker to OPEN after threshold consecutive failures", async () => {
    const pool = new RpcPool(
      [
        { id: "failing-provider", url: "https://fail.mock" },
        { id: "backup-provider", url: "https://backup.mock" },
      ],
      {
        chainId: 137,
        maxRetries: 1,
        circuitBreakerThreshold: 3,
        circuitBreakerCooldownMs: 10000,
      }
    );

    // Run 3 operations where failing-provider fails, backup succeeds
    for (let i = 0; i < 3; i++) {
      const res = await pool.execute(async (provider) => {
        const url = (provider as any)._getConnection?.()?.url;
        if (url === "https://fail.mock") {
          throw new Error("RPC Node Offline");
        }
        return "success-from-backup";
      });
      expect(res).toBe("success-from-backup");
    }

    const report = pool.getHealthReport();
    const failingP = report.find((r) => r.id === "failing-provider")!;
    expect(failingP.circuitBreakerState).toBe("OPEN");
    expect(failingP.isHealthy).toBe(false);
    expect(failingP.failureCount).toBe(3);

    // On subsequent operation, failing-provider should be excluded from eligible list
    const eligible = pool.getEligibleProviders();
    expect(eligible.some((p) => p.id === "failing-provider")).toBe(false);
    expect(eligible[0].id).toBe("backup-provider");
  });

  it("deduplicates simultaneous in-flight requests with cacheKey", async () => {
    const pool = new RpcPool(mockEndpoints, { chainId: 137 });

    let executionCount = 0;
    const task = () =>
      pool.execute(
        async () => {
          executionCount++;
          await new Promise((r) => setTimeout(r, 20));
          return "shared-balance-result";
        },
        { cacheKey: "balance:0x123:USDC" }
      );

    // Fire 5 simultaneous calls with same cache key
    const results = await Promise.all([task(), task(), task(), task(), task()]);

    expect(results).toEqual([
      "shared-balance-result",
      "shared-balance-result",
      "shared-balance-result",
      "shared-balance-result",
      "shared-balance-result",
    ]);
    expect(executionCount).toBe(1);
  });

  it("serves results from memory cache within TTL", async () => {
    const pool = new RpcPool(mockEndpoints, { chainId: 137 });

    let queryCount = 0;
    const read = () =>
      pool.execute(
        async () => {
          queryCount++;
          return 9999n;
        },
        { cacheKey: "blockNumber:latest", cacheTtlMs: 5000 }
      );

    const first = await read();
    const second = await read();

    expect(first).toBe(9999n);
    expect(second).toBe(9999n);
    expect(queryCount).toBe(1);
  });

  describe("Quorum Reads", () => {
    it("reaches consensus when providers return matching values", async () => {
      const pool = new RpcPool(mockEndpoints, { chainId: 137 });

      const result = await pool.executeQuorum(
        async () => {
          return 68000000;
        },
        undefined,
        2
      );

      expect(result.quorumReached).toBe(true);
      expect(result.value).toBe(68000000);
      expect(result.responses.length).toBeGreaterThanOrEqual(2);
    });

    it("detects disagreement and returns quorumReached: false when providers conflict", async () => {
      const pool = new RpcPool(mockEndpoints, { chainId: 137 });

      let callIndex = 0;
      const result = await pool.executeQuorum(
        async () => {
          callIndex++;
          return callIndex === 1 ? 100000000n : 50000000n;
        },
        (a, b) => a === b,
        2
      );

      expect(result.quorumReached).toBe(false);
      expect(result.value).toBeNull();
      expect(result.responses.length).toBe(2);
    });
  });
});
