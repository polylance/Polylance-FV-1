import { expect } from "chai";
import { ethers } from "hardhat";
import { JobEscrow, JobFactory, ReputationSBT } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("HiddenEdgeCases & Security Bounds", function () {
  let factory: JobFactory;
  let sbt: ReputationSBT;
  let jobImpl: JobEscrow;
  let admin: HardhatEthersSigner;
  let client: HardhatEthersSigner;
  let freelancer: HardhatEthersSigner;
  let arbitrator: HardhatEthersSigner;
  let attacker: HardhatEthersSigner;

  const JOB_DESCRIPTION = "QmJobDescriptionHash";
  const PROPOSAL_HASH = "QmProposalHash";

  beforeEach(async function () {
    [admin, client, freelancer, arbitrator, attacker] = await ethers.getSigners();

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
    await factory.grantRole(ARBITRATOR_ROLE, arbitrator.address);
  });

  // ── ReputationSBT Soulbound & Access Control ──

  describe("ReputationSBT Edge Cases", function () {
    it("should prevent direct minting by unauthorized callers", async function () {
      await expect(
        sbt.connect(attacker).mint(attacker.address, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(sbt, "AccessControlUnauthorizedAccount");
    });

    it("should prevent transfer of soulbound tokens via transferFrom", async function () {
      // Create a job and complete it to get an SBT
      const tx = await factory.connect(client).postJob(JOB_DESCRIPTION);
      const receipt = await tx.wait();
      const event = receipt?.logs
        .map((log) => {
          try { return factory.interface.parseLog(log as any); } catch { return null; }
        })
        .find((e) => e?.name === "JobDeployed");

      const jobAddress = event!.args.jobContract;
      const job = await ethers.getContractAt("JobEscrow", jobAddress) as JobEscrow;

      await job.connect(freelancer).applyToJob(PROPOSAL_HASH);
      await job.connect(client).selectFreelancer(freelancer.address);
      await job.connect(client).fundJob({ value: ethers.parseEther("1.0") });
      await job.connect(freelancer).submitWork("Title", "Desc", ["QmProof"]);
      await job.connect(client).releasePayment();

      expect(await sbt.ownerOf(0)).to.equal(freelancer.address);
      expect(await sbt.completedJob(0)).to.equal(jobAddress);

      // Attempt transfer
      await expect(
        sbt.connect(freelancer).transferFrom(freelancer.address, attacker.address, 0)
      ).to.be.revertedWith("Soulbound: non-transferable");
    });
  });

  // ── JobFactory Protection & Treasury Administration ──

  describe("JobFactory Security & Treasury", function () {
    it("should reject direct fee collection from non-job contracts", async function () {
      await expect(
        factory.connect(attacker).collectFee({ value: ethers.parseEther("0.1") })
      ).to.be.revertedWith("Only registered job contracts");
    });

    it("should reject direct mintReputationSBT calls from non-job contracts", async function () {
      await expect(
        factory.connect(attacker).mintReputationSBT(attacker.address, ethers.ZeroAddress)
      ).to.be.revertedWith("Only registered job contracts");
    });

    it("should enforce TREASURY_ADMIN_ROLE for treasury withdrawals", async function () {
      // Complete job to accumulate fee
      const tx = await factory.connect(client).postJob(JOB_DESCRIPTION);
      const receipt = await tx.wait();
      const event = receipt?.logs
        .map((log) => {
          try { return factory.interface.parseLog(log as any); } catch { return null; }
        })
        .find((e) => e?.name === "JobDeployed");

      const job = await ethers.getContractAt("JobEscrow", event!.args.jobContract) as JobEscrow;
      await job.connect(freelancer).applyToJob(PROPOSAL_HASH);
      await job.connect(client).selectFreelancer(freelancer.address);
      await job.connect(client).fundJob({ value: ethers.parseEther("10.0") });
      await job.connect(freelancer).submitWork("Title", "Desc", ["QmProof"]);
      await job.connect(client).releasePayment();

      const fee = (ethers.parseEther("10.0") * 250n) / 10000n; // 0.25 ETH
      expect(await factory.treasuryBalance()).to.equal(fee);

      // Non-admin withdrawal fails
      await expect(
        factory.connect(attacker).withdrawTreasury(attacker.address, fee)
      ).to.be.revertedWithCustomError(factory, "AccessControlUnauthorizedAccount");

      // Grant TREASURY_ADMIN_ROLE to admin
      const TREASURY_ADMIN_ROLE = await factory.TREASURY_ADMIN_ROLE();
      await factory.grantRole(TREASURY_ADMIN_ROLE, admin.address);

      // Withdrawal exceeding balance fails
      await expect(
        factory.connect(admin).withdrawTreasury(admin.address, fee + 1n)
      ).to.be.revertedWith("Insufficient treasury balance");

      // Successful withdrawal
      const recipientBefore = await ethers.provider.getBalance(admin.address);
      const withdrawTx = await factory.connect(admin).withdrawTreasury(admin.address, fee);
      const withdrawReceipt = await withdrawTx.wait();
      const gasUsed = withdrawReceipt!.gasUsed * withdrawReceipt!.gasPrice;

      expect(await factory.treasuryBalance()).to.equal(0n);
      const recipientAfter = await ethers.provider.getBalance(admin.address);
      expect(recipientAfter - recipientBefore + gasUsed).to.equal(fee);
    });
  });

  // ── JobEscrow State & Permission Guards ──

  describe("JobEscrow Edge Cases", function () {
    let job: JobEscrow;

    beforeEach(async function () {
      const tx = await factory.connect(client).postJob(JOB_DESCRIPTION);
      const receipt = await tx.wait();
      const event = receipt?.logs
        .map((log) => {
          try { return factory.interface.parseLog(log as any); } catch { return null; }
        })
        .find((e) => e?.name === "JobDeployed");

      job = await ethers.getContractAt("JobEscrow", event!.args.jobContract) as JobEscrow;
    });

    it("should prevent re-initialization of escrow contract", async function () {
      await expect(
        job.initialize(attacker.address, "QmHack", 3600)
      ).to.be.revertedWithCustomError(job, "InvalidInitialization");
    });

    it("should prevent non-client from funding job", async function () {
      await expect(
        job.connect(attacker).fundJob({ value: ethers.parseEther("1.0") })
      ).to.be.revertedWith("Only client funds");
    });

    it("should prevent submitting work with empty evidence array", async function () {
      await job.connect(freelancer).applyToJob(PROPOSAL_HASH);
      await job.connect(client).selectFreelancer(freelancer.address);

      await expect(
        job.connect(freelancer).submitWork("Title", "Desc", [])
      ).to.be.revertedWith("Must attach evidence");
    });

    it("should prevent non-party from proposing terms or raising dispute", async function () {
      await job.connect(freelancer).applyToJob(PROPOSAL_HASH);
      await job.connect(client).selectFreelancer(freelancer.address);

      await expect(
        job.connect(attacker).proposeTerms(ethers.id("terms"))
      ).to.be.revertedWith("Not a party to this job");

      await expect(
        job.connect(attacker).raiseDispute(0, "QmEvidence")
      ).to.be.revertedWith("Not a party to this job");
    });

    it("should prevent declining selection after terms are finalized", async function () {
      await job.connect(freelancer).applyToJob(PROPOSAL_HASH);
      await job.connect(client).selectFreelancer(freelancer.address);

      const termsHash = ethers.id("terms");
      await job.connect(client).proposeTerms(termsHash);
      await job.connect(freelancer).proposeTerms(termsHash);

      await expect(
        job.connect(freelancer).declineSelection()
      ).to.be.revertedWith("Terms already finalized");
    });

    it("should allow arbitrator to resolve dispute with 0% to freelancer (100% refund to client)", async function () {
      await job.connect(freelancer).applyToJob(PROPOSAL_HASH);
      await job.connect(client).selectFreelancer(freelancer.address);
      await job.connect(client).fundJob({ value: ethers.parseEther("2.0") });
      await job.connect(freelancer).submitWork("Title", "Desc", ["QmProof"]);
      await job.connect(client).raiseDispute(0, "QmClientEv");

      const clientBefore = await ethers.provider.getBalance(client.address);
      const freelancerBefore = await ethers.provider.getBalance(freelancer.address);

      // Resolve: 0 bps to freelancer
      await job.connect(arbitrator).resolveDispute(0, "Client wins");

      const clientAfter = await ethers.provider.getBalance(client.address);
      const freelancerAfter = await ethers.provider.getBalance(freelancer.address);

      const fee = (ethers.parseEther("2.0") * 250n) / 10000n;
      const expectedRefund = ethers.parseEther("2.0") - fee;

      expect(clientAfter - clientBefore).to.equal(expectedRefund);
      expect(freelancerAfter).to.equal(freelancerBefore);
      // Freelancer receives 0 bps -> no SBT minted
      expect(await sbt.balanceOf(freelancer.address)).to.equal(0n);
    });

    it("should revert if arbitrator resolves with > 10000 bps", async function () {
      await job.connect(freelancer).applyToJob(PROPOSAL_HASH);
      await job.connect(client).selectFreelancer(freelancer.address);
      await job.connect(freelancer).submitWork("Title", "Desc", ["QmProof"]);
      await job.connect(client).raiseDispute(0, "QmClientEv");

      await expect(
        job.connect(arbitrator).resolveDispute(10001, "Invalid")
      ).to.be.revertedWith("Invalid split");
    });
  });
});
