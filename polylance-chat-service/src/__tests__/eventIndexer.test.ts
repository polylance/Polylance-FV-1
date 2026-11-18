import { describe, it, expect, vi } from "vitest";
import { EventIndexer } from "../indexer/EventIndexer.js";
import { RpcPool, isClientSideRequestError } from "../rpc/RpcPool.js";

describe("EventIndexer & Adaptive Chunking", () => {
  const factoryAddress = "0x0D34F6B4Fb25662ac798A4971664E591f253d00B";

  it("fails fast on startup if factoryAddress is missing or invalid", () => {
    const mockPool = {} as any;
    expect(() => new EventIndexer(mockPool, "")).toThrow(/Invalid or missing factoryAddress/);
    expect(() => new EventIndexer(mockPool, "invalid-address")).toThrow(/Invalid or missing factoryAddress/);
  });

  it("always includes contract address and event topics in getLogs filter", async () => {
    let capturedFilter: any = null;

    const mockPool: Partial<RpcPool> = {
      execute: vi.fn().mockImplementation(async (op: any) => {
        const dummyProvider = {
          getBlockNumber: vi.fn().mockResolvedValue(1000),
          getLogs: vi.fn().mockImplementation((filter: any) => {
            capturedFilter = filter;
            return Promise.resolve([]);
          }),
        };
        return op(dummyProvider);
      }),
    };

    const extraJobAddress = "0x1111111111111111111111111111111111111111";
    const indexer = new EventIndexer(
      mockPool as RpcPool,
      factoryAddress,
      { lastBlockNumber: 900, updatedAt: Date.now() },
      50,
      () => [extraJobAddress]
    );

    await indexer.pollLogs();

    expect(capturedFilter).not.toBeNull();
    expect(capturedFilter.address).toBeDefined();
    expect(Array.isArray(capturedFilter.address)).toBe(true);
    expect(capturedFilter.address).toContain(factoryAddress);
    expect(capturedFilter.address).toContain(extraJobAddress);
    expect(capturedFilter.topics).toBeDefined();
    expect(Array.isArray(capturedFilter.topics[0])).toBe(true);
    expect(capturedFilter.topics[0].length).toBeGreaterThan(0);
    // Range must not exceed 50 blocks
    expect(capturedFilter.toBlock - capturedFilter.fromBlock).toBeLessThanOrEqual(50);
  });

  it("adapts chunk size when RPC returns -32602 or 'limited to 50 blocks range' without advancing cursor", async () => {
    let callCount = 0;
    const initialCursorBlock = 500;

    const mockPool: Partial<RpcPool> = {
      execute: vi.fn().mockImplementation(async (op: any) => {
        callCount++;
        const dummyProvider = {
          getBlockNumber: vi.fn().mockResolvedValue(1000),
          getLogs: vi.fn().mockImplementation(() => {
            const err: any = new Error("eth_getLogs error -32602: limited to 0 - 50 blocks range");
            err.code = -32602;
            return Promise.reject(err);
          }),
        };
        return op(dummyProvider);
      }),
    };

    const indexer = new EventIndexer(
      mockPool as RpcPool,
      factoryAddress,
      { lastBlockNumber: initialCursorBlock, updatedAt: Date.now() },
      500 // Start with high requested chunk size
    );

    // Initial chunk size capped to 50 for safety
    expect(indexer.getChunkSize()).toBe(50);

    await indexer.pollLogs();

    // Cursor must NOT have advanced because the chunk failed
    expect(indexer.getCursor().lastBlockNumber).toBe(initialCursorBlock);
    // Learned limit must be respected
    expect(indexer.getChunkSize()).toBeLessThanOrEqual(50);
  });

  it("advances cursor only after successful chunk processing", async () => {
    const processedEvents: any[] = [];
    const mockPool: Partial<RpcPool> = {
      execute: vi.fn().mockImplementation(async (op: any) => {
        const dummyProvider = {
          getBlockNumber: vi.fn().mockResolvedValue(600),
          getLogs: vi.fn().mockResolvedValue([]),
        };
        return op(dummyProvider);
      }),
    };

    const indexer = new EventIndexer(
      mockPool as RpcPool,
      factoryAddress,
      { lastBlockNumber: 500, updatedAt: Date.now() },
      50
    );

    indexer.setOnEvent(async (evt) => {
      processedEvents.push(evt);
    });

    await indexer.pollLogs();

    // Cursor advances to toBlock
    expect(indexer.getCursor().lastBlockNumber).toBeGreaterThan(500);
  });

  it("correctly identifies client request errors in isClientSideRequestError", () => {
    expect(isClientSideRequestError({ code: -32602, message: "Invalid params" })).toBe(true);
    expect(isClientSideRequestError({ code: -32701, message: "Please specify an address in your request" })).toBe(true);
    expect(isClientSideRequestError({ message: "limited to 0 - 50 blocks range" })).toBe(true);
    expect(isClientSideRequestError({ status: 400, message: "Bad Request" })).toBe(true);

    // Provider failures should NOT be marked as client error
    expect(isClientSideRequestError({ status: 503, message: "Service Unavailable" })).toBe(false);
    expect(isClientSideRequestError({ status: 429, message: "Rate limit exceeded" })).toBe(false);
    expect(isClientSideRequestError({ message: "ETIMEDOUT: Connection timed out" })).toBe(false);
  });
});
