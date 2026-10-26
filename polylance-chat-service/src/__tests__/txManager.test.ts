import { describe, it, expect, vi, beforeEach } from "vitest";
import { TxManager, TransactionRecord } from "../transactions/TxManager.js";
import { RpcPool } from "../rpc/RpcPool.js";

describe("TxManager Durable Transaction Engine", () => {
  let mockRpcPool: RpcPool;
  let txManager: TxManager;

  const mockEndpoints = [
    { id: "mock-provider-1", url: "https://rpc1.mock" },
    { id: "mock-provider-2", url: "https://rpc2.mock" },
  ];

  beforeEach(() => {
    mockRpcPool = new RpcPool(mockEndpoints, { chainId: 137 });
    txManager = new TxManager(mockRpcPool);
  });

  describe("Intent Creation & Validation", () => {
    it("creates a funding intent with 2.5% fee and precise confirmation depth", () => {
      const { intent, isExisting } = txManager.createIntent({
        jobId: "job-101",
        type: "FUND",
        from: "0xClient111111111111111111111111111111111111",
        idempotencyKey: "fund-job-101-uuid-1",
        jobData: {
          amountUsdc: "100.00",
          paymentTokenSymbol: "USDC",
        },
      });

      expect(isExisting).toBe(false);
      expect(intent.jobId).toBe("job-101");
      expect(intent.type).toBe("FUND");
      expect(intent.status).toBe("INITIATED");
      // 100 USDC (6 decimals) = 100000000n
      expect(intent.amount).toBe("100000000");
      // 2.5% fee = 2500000n
      expect(intent.feeAmount).toBe("2500000");
      // Total = 102500000n
      expect(intent.totalAmount).toBe("102500000");
      // Tier < $250 -> 3 confirmations
      expect(intent.requiredConfirmations).toBe(3);
    });

    it("assigns 5 confirmations for tier $250 - $2500, and 10 confirmations for > $2500", () => {
      const midTier = txManager.createIntent({
        jobId: "job-mid",
        type: "FUND",
        from: "0xClient111111111111111111111111111111111111",
        idempotencyKey: "fund-mid",
        jobData: { amountUsdc: "500.00", paymentTokenSymbol: "USDC" },
      });
      expect(midTier.intent.requiredConfirmations).toBe(5);

      const highTier = txManager.createIntent({
        jobId: "job-high",
        type: "FUND",
        from: "0xClient111111111111111111111111111111111111",
        idempotencyKey: "fund-high",
        jobData: { amountUsdc: "5000.00", paymentTokenSymbol: "USDC" },
      });
      expect(highTier.intent.requiredConfirmations).toBe(10);
    });

    it("is strictly idempotent: returns the same intent when given identical idempotencyKey", () => {
      const first = txManager.createIntent({
        jobId: "job-idem",
        type: "FUND",
        from: "0xClient111111111111111111111111111111111111",
        idempotencyKey: "unique-key-xyz",
        jobData: { amountUsdc: "50.00", paymentTokenSymbol: "USDC" },
      });

      const second = txManager.createIntent({
        jobId: "job-idem",
        type: "FUND",
        from: "0xClient111111111111111111111111111111111111",
        idempotencyKey: "unique-key-xyz",
        jobData: { amountUsdc: "50.00", paymentTokenSymbol: "USDC" },
      });

      expect(first.isExisting).toBe(false);
      expect(second.isExisting).toBe(true);
      expect(second.intent.id).toBe(first.intent.id);
    });

    it("prevents double-funding: blocks creation of duplicate FUND intent while one is active", () => {
      const first = txManager.createIntent({
        jobId: "job-single-fund",
        type: "FUND",
        from: "0xClient111111111111111111111111111111111111",
        idempotencyKey: "key-1",
        jobData: { amountUsdc: "50.00", paymentTokenSymbol: "USDC" },
      });

      // Second intent with different idempotency key on the same job
      const second = txManager.createIntent({
        jobId: "job-single-fund",
        type: "FUND",
        from: "0xClient111111111111111111111111111111111111",
        idempotencyKey: "key-2",
        jobData: { amountUsdc: "50.00", paymentTokenSymbol: "USDC" },
      });

      // Second is blocked and returns the existing active intent
      expect(second.isExisting).toBe(true);
      expect(second.intent.id).toBe(first.intent.id);
    });
  });

  describe("Transaction Lifecycle Transitions", () => {
    it("transitions from INITIATED to PENDING upon submission of txHash", () => {
      const { intent } = txManager.createIntent({
        jobId: "job-submit-test",
        type: "FUND",
        from: "0xClient111111111111111111111111111111111111",
        idempotencyKey: "key-submit",
        jobData: { amountUsdc: "100.00", paymentTokenSymbol: "USDC" },
      });

      const updated = txManager.registerSubmitted(
        intent.id,
        "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        42
      );

      expect(updated.status).toBe("PENDING");
      expect(updated.txHash).toBe("0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890");
      expect(updated.nonce).toBe(42);

      // Indexed by hash
      const byHash = txManager.getTransactionByHash(updated.txHash);
      expect(byHash?.id).toBe(intent.id);
    });

    it("notifies state change listener when transaction is submitted", async () => {
      const stateChanges: { status: string; id: string }[] = [];
      txManager.setOnStateChange(async (tx) => {
        stateChanges.push({ status: tx.status, id: tx.id });
      });

      const { intent } = txManager.createIntent({
        jobId: "job-callback-test",
        type: "FUND",
        from: "0xClient111111111111111111111111111111111111",
        idempotencyKey: "key-cb",
        jobData: { amountUsdc: "20.00", paymentTokenSymbol: "USDC" },
      });

      txManager.registerSubmitted(
        intent.id,
        "0x1234567890123456789012345678901234567890123456789012345678901234"
      );
      expect(stateChanges.length).toBe(1);
      expect(stateChanges[0].status).toBe("PENDING");
    });
  });
});
