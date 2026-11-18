import { describe, it, expect, vi } from "vitest";
import { getEngagementDisplayState } from "../lifecycle.js";
import { DeadlineWorker } from "../workers/DeadlineWorker.js";

describe("PolyLance Lifecycle, Deadline & Money-State Rules", () => {
  const mockClient = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  const mockFreelancer = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
  const mockContract = "0xcccccccccccccccccccccccccccccccccccccccc";

  it("Money-State Rule: never marks completed/paid when freelancer never submitted even after deadline", () => {
    const fundedAt = Date.now() - 10 * 86400000;
    const deadlineTimestamp = Date.now() - 3 * 86400000; // 3 days ago

    const job = {
      id: "job-overdue-1",
      title: "Design Landing Page",
      client: mockClient,
      freelancer: mockFreelancer,
      contractAddress: mockContract,
      status: "Funded",
      fundedAt,
      deadlineTimestamp,
      events: [{ step: "Funded", status: "completed", timestamp: fundedAt }],
    };

    const display = getEngagementDisplayState(job, []);
    expect(display.isCompleted).toBe(false);
    expect(display.isPaid).toBe(false);
    expect(display.isApproved).toBe(false);
    // Overdue/expired
    expect(display.isOverdue).toBe(true);
    expect(display.state).toBe("EXPIRED_NO_SUBMISSION");
    expect(display.displayLabel).toContain("Deadline Expired");
  });

  it("Money-State Rule: never marks completed/paid on late submission without approval and confirmed release", () => {
    const fundedAt = Date.now() - 10 * 86400000;
    const deadlineTimestamp = Date.now() - 5 * 86400000;
    const submittedAt = Date.now() - 2 * 86400000; // Submitted 3 days late

    const job = {
      id: "job-late-1",
      title: "Smart Contract Audit",
      client: mockClient,
      freelancer: mockFreelancer,
      contractAddress: mockContract,
      status: "Submitted",
      fundedAt,
      deadlineTimestamp,
      deliverableSubmittedAt: submittedAt,
      events: [
        { step: "Funded", status: "completed", timestamp: fundedAt },
        { step: "Submitted", status: "completed", timestamp: submittedAt },
      ],
    };

    const display = getEngagementDisplayState(job, []);
    expect(display.isCompleted).toBe(false);
    expect(display.isPaid).toBe(false);
    expect(display.isLate).toBe(true);
    expect(display.lateByMs).toBeGreaterThan(0);
    expect(display.state).toBe("SUBMITTED_LATE");
    expect(display.displayLabel).toContain("Submitted Late");
  });

  it("Money-State Rule: approval without confirmed release transaction marks approved but NOT completed/paid", () => {
    const fundedAt = Date.now() - 10 * 86400000;
    const deadlineTimestamp = Date.now() + 5 * 86400000;
    const submittedAt = Date.now() - 1 * 86400000;

    const job = {
      id: "job-approved-pending-release",
      title: "Mobile App UI",
      client: mockClient,
      freelancer: mockFreelancer,
      contractAddress: mockContract,
      status: "Approved",
      approvedAt: Date.now(),
      fundedAt,
      deadlineTimestamp,
      deliverableSubmittedAt: submittedAt,
      events: [
        { step: "Funded", status: "completed", timestamp: fundedAt },
        { step: "Submitted", status: "completed", timestamp: submittedAt },
      ],
    };

    // Release transaction is in-flight (PENDING)
    const pendingTx = {
      jobId: job.id,
      to: mockContract,
      type: "RELEASE",
      status: "PENDING",
    };

    const display = getEngagementDisplayState(job, [pendingTx]);
    expect(display.isApproved).toBe(true);
    expect(display.isCompleted).toBe(false);
    expect(display.isPaid).toBe(false);
    expect(display.state).toBe("PAYMENT_PENDING");
    expect(display.displayLabel).toContain("Payment confirming");
  });

  it("Money-State Rule: ONLY marks Completed & Paid when release transaction is CONFIRMED on-chain", () => {
    const fundedAt = Date.now() - 10 * 86400000;
    const deadlineTimestamp = Date.now() + 5 * 86400000;
    const submittedAt = Date.now() - 1 * 86400000;

    const job = {
      id: "job-confirmed-complete",
      title: "Mobile App UI",
      client: mockClient,
      freelancer: mockFreelancer,
      contractAddress: mockContract,
      status: "Completed",
      approvedAt: Date.now() - 3600000,
      fundedAt,
      deadlineTimestamp,
      deliverableSubmittedAt: submittedAt,
      events: [
        { step: "Funded", status: "completed", timestamp: fundedAt },
        { step: "Submitted", status: "completed", timestamp: submittedAt },
        { step: "Paid", status: "completed", timestamp: Date.now(), txHash: "0x999" },
      ],
    };

    const confirmedTx = {
      jobId: job.id,
      to: mockContract,
      type: "RELEASE",
      status: "CONFIRMED",
      txHash: "0x999",
    };

    const display = getEngagementDisplayState(job, [confirmedTx]);
    expect(display.isApproved).toBe(true);
    expect(display.isCompleted).toBe(true);
    expect(display.isPaid).toBe(true);
    expect(display.state).toBe("COMPLETED");
    expect(display.displayLabel).toContain("Job Completed & Payment Released");
  });

  describe("DeadlineWorker Watchdog & Idempotency", () => {
    it("fires alerts for overdue jobs and dedupes across successive ticks", async () => {
      const now = Date.now();
      const job = {
        id: "job-watchdog-1",
        title: "Frontend Build",
        client: mockClient,
        freelancer: mockFreelancer,
        contractAddress: mockContract,
        status: "Funded",
        fundedAt: now - 5 * 86400000,
        deadlineTimestamp: now - 3600000, // 1 hour overdue (grace period active)
        deadlineVersion: 1,
        events: [{ step: "Funded", status: "completed", timestamp: now - 5 * 86400000 }],
      };

      const notifications: any[] = [];
      const mockRpcPool = {
        getPublicHealthSummary: vi.fn().mockReturnValue({ networkStatus: "HEALTHY", activeProviders: 2 }),
      } as any;

      const worker = new DeadlineWorker({
        getJobs: () => [job],
        getTransactions: () => [],
        rpcPool: mockRpcPool,
        createNotification: (n) => {
          notifications.push(n);
        },
        persistState: vi.fn().mockResolvedValue(undefined),
        broadcastSync: vi.fn(),
      });

      // Tick 1
      await worker.tick();
      expect(notifications.length).toBe(2); // 1 to freelancer, 1 to client
      expect(notifications[0].type).toBe("DEADLINE_OVERDUE");

      // Tick 2 immediately after: should NOT double-fire due to dedupeKey
      await worker.tick();
      expect(notifications.length).toBe(2);
    });

    it("pauses deadline alerts during network / RPC outages (platform-fault fairness)", async () => {
      const now = Date.now();
      const job = {
        id: "job-outage-pause",
        title: "API Backend",
        client: mockClient,
        freelancer: mockFreelancer,
        contractAddress: mockContract,
        status: "Funded",
        fundedAt: now - 5 * 86400000,
        deadlineTimestamp: now - 3600000,
        events: [{ step: "Funded", status: "completed", timestamp: now - 5 * 86400000 }],
      };

      const notifications: any[] = [];
      const mockRpcPool = {
        getPublicHealthSummary: vi.fn().mockReturnValue({ networkStatus: "DOWN", activeProviders: 0 }),
      } as any;

      const worker = new DeadlineWorker({
        getJobs: () => [job],
        getTransactions: () => [],
        rpcPool: mockRpcPool,
        createNotification: (n) => {
          notifications.push(n);
        },
        persistState: vi.fn().mockResolvedValue(undefined),
        broadcastSync: vi.fn(),
      });

      await worker.tick();

      // No notifications sent during network outage
      expect(notifications.length).toBe(0);
      expect(worker.getStatus().isPausedDueToOutage).toBe(true);
    });
  });
});
