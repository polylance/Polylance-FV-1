import { expect } from "chai";
import { ethers } from "hardhat";
import { setIndexerConfig, getAllJobAddresses, getJobEvents } from "../lib/indexing/eventIndexer";
import { getAllPlatformEvents, invalidateCache } from "../lib/indexing/aggregate";
import { getPublicStats } from "../lib/indexing/publicStats";
import { getPersonalStats } from "../lib/indexing/personalStats";
import { getAdminStats } from "../lib/indexing/adminStats";
import { getJobTimeline } from "../lib/indexing/jobTimeline";
import { GET as publicRouteHandler } from "../app/api/analytics/public/route";
import { GET as timelineRouteHandler } from "../app/api/jobs/[address]/timeline/route";
import { JobFactory, JobEscrow, ReputationSBT } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("Event Indexing Service & Analytics Tiers", function () {
  let factory: JobFactory;
  let sbt: ReputationSBT;
  let jobImpl: JobEscrow;
  let client: HardhatEthersSigner;
  let freelancer1: HardhatEthersSigner;
  let freelancer2: HardhatEthersSigner;
  let judge: HardhatEthersSigner;

  let job1Addr: string;
  let job2Addr: string;

  before(async function () {
    [client, freelancer1, freelancer2, judge] = await ethers.getSigners();

    jobImpl = await ethers.deployContract("JobEscrow");
    await jobImpl.waitForDeployment();

    sbt = await ethers.deployContract("ReputationSBT", [ethers.ZeroAddress]);
    await sbt.waitForDeployment();

    factory = await ethers.deployContract("JobFactory", [
      await jobImpl.getAddress(),
      await sbt.getAddress(),
    ]);
    await factory.waitForDeployment();

    const MINTER_ROLE = await sbt.MINTER_ROLE();
    await sbt.grantRole(MINTER_ROLE, await factory.getAddress());

    const ARBITRATOR_ROLE = await factory.ARBITRATOR_ROLE();
    await factory.grantRole(ARBITRATOR_ROLE, judge.address);

    const factoryAddress = await factory.getAddress();

    // Configure Indexer to use local Hardhat ethers provider and factory contract
    setIndexerConfig(ethers.provider, factoryAddress);
    invalidateCache();

    // ── Execute Job 1 Lifecycle (Happy path) ──
    const tx1 = await factory.connect(client).postJob("QmDescription1", ethers.ZeroAddress);
    const receipt1 = await tx1.wait();
    const event1 = receipt1?.logs
      .map((l) => {
        try { return factory.interface.parseLog(l as any); } catch { return null; }
      })
      .find((e) => e?.name === "JobDeployed");
    job1Addr = event1!.args.jobContract;

    const job1 = (await ethers.getContractAt("JobEscrow", job1Addr)) as JobEscrow;
    await job1.connect(freelancer1).applyToJob("QmProposal1");
    await job1.connect(client).selectFreelancer(freelancer1.address);
    await job1.connect(client).fundJob(0, { value: ethers.parseEther("2.0") }); // 2 ETH TVL
    await job1.connect(freelancer1).submitWork("Deliverable 1", "Done", ["QmProof1"]);
    await job1.connect(client).releasePayment(); // Completed

    // ── Execute Job 2 Lifecycle (Disputed & Resolved by Judge) ──
    const tx2 = await factory.connect(client).postJob("QmDescription2", ethers.ZeroAddress);
    const receipt2 = await tx2.wait();
    const event2 = receipt2?.logs
      .map((l) => {
        try { return factory.interface.parseLog(l as any); } catch { return null; }
      })
      .find((e) => e?.name === "JobDeployed");
    job2Addr = event2!.args.jobContract;

    const job2 = (await ethers.getContractAt("JobEscrow", job2Addr)) as JobEscrow;
    await job2.connect(freelancer2).applyToJob("QmProposal2");
    await job2.connect(client).selectFreelancer(freelancer2.address);
    await job2.connect(client).fundJob(0, { value: ethers.parseEther("1.0") }); // 1 ETH TVL
    await job2.connect(freelancer2).submitWork("Deliverable 2", "Done", ["QmProof2"]);
    await job2.connect(client).raiseDispute(0, "QmDisputeEvidence");
    await job2.connect(judge).resolveDispute(8000, "QmJudgeReasoning"); // 80% to freelancer, 20% refund
  });

  afterEach(function () {
    invalidateCache();
  });

  describe("PHASE 0 & 1 — Core Indexer & Aggregation", function () {
    it("should retrieve all job clone addresses from JobFactory", async function () {
      const addresses = await getAllJobAddresses();
      expect(addresses.length).to.equal(2);
      expect(addresses[0].toLowerCase()).to.equal(job1Addr.toLowerCase());
      expect(addresses[1].toLowerCase()).to.equal(job2Addr.toLowerCase());
    });

    it("should fetch all events for a single job with block timestamps", async function () {
      const events = await getJobEvents(job1Addr);
      expect(events.length).to.be.gte(6);

      const eventNames = events.map((e) => e.eventName);
      expect(eventNames).to.include("JobPosted");
      expect(eventNames).to.include("ApplicationSubmitted");
      expect(eventNames).to.include("FreelancerSelected");
      expect(eventNames).to.include("JobFunded");
      expect(eventNames).to.include("WorkSubmitted");
      expect(eventNames).to.include("PaymentReleased");

      // Verify timestamps were resolved
      for (const event of events) {
        expect(event.timestamp).to.be.gt(0);
      }
    });

    it("should aggregate all platform events with caching and invalidation", async function () {
      const events1 = await getAllPlatformEvents();
      expect(events1.length).to.be.gt(0);

      // Second call should return cached instance
      const events2 = await getAllPlatformEvents();
      expect(events2).to.equal(events1);

      // Invalidation forces new fetch
      invalidateCache();
      const events3 = await getAllPlatformEvents();
      expect(events3).to.not.equal(events1);
    });
  });

  describe("PHASE 2 — Analytics Tiers (Public, Personal, Admin)", function () {
    it("should compute public stats with real TVL and null fallback for unmeasured metrics", async function () {
      const publicStats = await getPublicStats();
      expect(publicStats.totalJobsPosted).to.equal(2);
      expect(publicStats.totalValueLocked).to.equal(ethers.parseEther("3.0").toString()); // 2.0 + 1.0 ETH
      expect(publicStats.jobsCompleted).to.equal(2); // Job 1 PaymentReleased + Job 2 DisputeResolved
      expect(publicStats.disputeRate).to.equal(0.5); // 1 dispute / 2 jobs = 0.5
      expect(publicStats.avgDisputeResolutionSeconds).to.be.a("number");
    });

    it("should compute personal stats for freelancers correctly", async function () {
      const f1Stats = await getPersonalStats(freelancer1.address);
      expect(f1Stats.applicationsSent).to.equal(1);
      expect(f1Stats.jobsCompleted).to.equal(1);
      expect(f1Stats.successRate).to.equal(1.0); // 1 completed / 1 applied

      const expectedFee1 = (ethers.parseEther("2.0") * 250n) / 10000n;
      const expectedEarned1 = ethers.parseEther("2.0") - expectedFee1;
      expect(f1Stats.totalEarned).to.equal(expectedEarned1.toString());

      // Unapplied user returns null successRate
      const randomUserStats = await getPersonalStats("0x0000000000000000000000000000000000000099");
      expect(randomUserStats.applicationsSent).to.equal(0);
      expect(randomUserStats.successRate).to.be.null;
    });

    it("should compute admin stats for fee totals and judge rulings", async function () {
      const adminStats = await getAdminStats();

      // Platform fee collected from Job 1 (0.05 ETH) + Job 2 (0.025 ETH) = 0.075 ETH
      const fee1 = (ethers.parseEther("2.0") * 250n) / 10000n; // 0.05 ETH
      const fee2 = (ethers.parseEther("1.0") * 250n) / 10000n; // 0.025 ETH
      const expectedTotalFees = fee1 + fee2;
      expect(adminStats.totalFeesCollected).to.equal(expectedTotalFees.toString());

      // Rulings by judge map
      expect(adminStats.rulingsByJudge[judge.address]).to.equal(1);
    });
  });

  describe("PHASE 3 & 4 — Job Timeline & API Routes", function () {
    it("should construct a chronological job timeline with Polygonscan Amoy URLs", async function () {
      const timeline = await getJobTimeline(job1Addr);
      expect(timeline.length).to.be.gte(6);
      expect(timeline[0].step).to.equal("JobPosted");

      for (const item of timeline) {
        expect(item.polygonscanUrl).to.include("https://amoy.polygonscan.com/tx/");
        expect(item.txHash).to.be.a("string");
      }
    });

    it("should serve public analytics API route", async function () {
      const res = await publicRouteHandler();
      expect(res.status).to.equal(200);
      const json = await res.json();
      expect(json.totalJobsPosted).to.equal(2);
    });

    it("should serve job timeline API route", async function () {
      const res = await timelineRouteHandler(new Request("http://localhost:3000"), {
        params: { address: job1Addr },
      });
      expect(res.status).to.equal(200);
      const timeline = await res.json();
      expect(timeline.length).to.be.gte(6);
    });
  });
});
