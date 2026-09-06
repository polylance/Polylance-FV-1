import { expect } from "chai";
import { ethers, network } from "hardhat";
import { mine } from "@nomicfoundation/hardhat-network-helpers";
import { JudgeDAO, ReputationSBT, JobFactory, JobEscrow, TimelockController } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("JudgeDAO — Dynamic Quorum & Timelock Integration", function () {
  let judgeDAO: JudgeDAO;
  let timelock: TimelockController;
  let sbt: ReputationSBT;
  let factory: JobFactory;
  let jobImpl: JobEscrow;
  let deployer: HardhatEthersSigner;
  let sbtHolder: HardhatEthersSigner;
  let nonHolder: HardhatEthersSigner;
  let judgeBeingRemoved: HardhatEthersSigner;

  const VOTING_DELAY_BLOCKS = 86400; // 1 day
  const VOTING_PERIOD_BLOCKS = 7 * 86400; // 7 days
  const TIMELOCK_DELAY_SECONDS = 2 * 24 * 60 * 60; // 2 days

  beforeEach(async function () {
    [deployer, sbtHolder, nonHolder, judgeBeingRemoved] = await ethers.getSigners();

    jobImpl = await ethers.deployContract("JobEscrow");
    await jobImpl.waitForDeployment();

    sbt = await ethers.deployContract("ReputationSBT", [deployer.address]);
    await sbt.waitForDeployment();

    factory = await ethers.deployContract("JobFactory", [
      await jobImpl.getAddress(),
      await sbt.getAddress(),
    ]);
    await factory.waitForDeployment();

    const MINTER_ROLE = await sbt.MINTER_ROLE();
    await sbt.grantRole(MINTER_ROLE, await factory.getAddress());

    // Deploy TimelockController (2 days minDelay)
    timelock = await ethers.deployContract("TimelockController", [
      TIMELOCK_DELAY_SECONDS,
      [],
      [ethers.ZeroAddress], // open executor
      deployer.address,
    ]);
    await timelock.waitForDeployment();

    // Deploy JudgeDAO with TimelockController
    judgeDAO = await ethers.deployContract("JudgeDAO", [
      await sbt.getAddress(),
      await timelock.getAddress(),
    ]);
    await judgeDAO.waitForDeployment();

    // Grant JudgeDAO PROPOSER_ROLE on TimelockController
    const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
    await timelock.grantRole(PROPOSER_ROLE, await judgeDAO.getAddress());

    // Grant JobFactory's DEFAULT_ADMIN_ROLE to TimelockController (so executed proposals can grant/revoke roles)
    const DEFAULT_ADMIN_ROLE = await factory.DEFAULT_ADMIN_ROLE();
    await factory.grantRole(DEFAULT_ADMIN_ROLE, await timelock.getAddress());

    // Mint an SBT to deployer by completing a job
    const tx = await factory.connect(sbtHolder).postJob("QmJob", ethers.ZeroAddress);
    const receipt = await tx.wait();
    const event = receipt?.logs
      .map((log) => {
        try { return factory.interface.parseLog(log as any); } catch { return null; }
      })
      .find((e) => e?.name === "JobDeployed");

    const jobAddress = event!.args.jobContract;
    const job = await ethers.getContractAt("JobEscrow", jobAddress) as JobEscrow;

    await job.connect(deployer).applyToJob("QmProposal");
    await job.connect(sbtHolder).selectFreelancer(deployer.address);
    await job.connect(sbtHolder).fundJob(0, { value: ethers.parseEther("1") });
    await job.connect(deployer).submitWork("Done", "desc", ["QmEv"]);
    await job.connect(sbtHolder).releasePayment();
  });

  async function buildGrantRoleCalldata(target: string) {
    const ARBITRATOR_ROLE = await factory.ARBITRATOR_ROLE();
    return factory.interface.encodeFunctionData("grantRole", [ARBITRATOR_ROLE, target]);
  }

  async function createArbitratorProposal(
    proposer: HardhatEthersSigner,
    target: string
  ): Promise<{ proposalId: bigint; targets: string[]; values: bigint[]; calldatas: string[]; description: string; descriptionHash: string }> {
    const calldata = await buildGrantRoleCalldata(target);
    const description = `Grant ARBITRATOR_ROLE to ${target}`;
    const descriptionHash = ethers.id(description);
    const targets = [await factory.getAddress()];
    const values = [0n];
    const calldatas = [calldata];

    const tx = await judgeDAO.connect(proposer).propose(targets, values, calldatas, description);
    const receipt = await tx.wait();
    const event = receipt?.logs
      .map((l) => {
        try { return judgeDAO.interface.parseLog(l as any); } catch { return null; }
      })
      .find((e) => e?.name === "ProposalCreated");

    return {
      proposalId: event!.args.proposalId as bigint,
      targets,
      values,
      calldatas,
      description,
      descriptionHash,
    };
  }

  describe("FIX 1 — Quorum is a dynamic 20% percentage", function () {
    it("quorum scales dynamically with total SBT supply", async function () {
      await mine(1);
      const currentBlock = await ethers.provider.getBlockNumber();
      const requiredQuorum = await judgeDAO.quorum(currentBlock - 1);

      expect(requiredQuorum).to.equal(0n);
    });

    it("quorum with 10 total holders requires 2 votes (20% of 10)", async function () {
      const MINTER_ROLE = await sbt.MINTER_ROLE();
      await sbt.grantRole(MINTER_ROLE, deployer.address);

      const signers = await ethers.getSigners();
      for (let i = 0; i < 9; i++) {
        await sbt.mint(signers[i].address, ethers.ZeroAddress);
      }

      await mine(1);
      const blockNum = await ethers.provider.getBlockNumber();
      const requiredQuorum = await judgeDAO.quorum(blockNum - 1);
      expect(requiredQuorum).to.equal(2n); // 20% of 10 total holders = 2
    });
  });

  describe("FIX 2 — Timelock execution delay enforcement", function () {
    it("blocks immediate execution post-vote and enforces 2-day timelock delay", async function () {
      const ARBITRATOR_ROLE = await factory.ARBITRATOR_ROLE();
      await factory.grantRole(ARBITRATOR_ROLE, judgeBeingRemoved.address);
      expect(await factory.hasRole(ARBITRATOR_ROLE, judgeBeingRemoved.address)).to.be.true;

      const { proposalId, targets, values, calldatas, descriptionHash } = await createArbitratorProposal(
        deployer,
        nonHolder.address
      );

      // Advance past voting delay
      await mine(VOTING_DELAY_BLOCKS + 1);
      expect(await judgeDAO.state(proposalId)).to.equal(1n); // Active

      // Cast vote
      await judgeDAO.connect(deployer).castVote(proposalId, 1);

      // Advance past voting period
      await mine(VOTING_PERIOD_BLOCKS + 1);
      expect(await judgeDAO.state(proposalId)).to.equal(4n); // Succeeded

      // Queue proposal into TimelockController
      await judgeDAO.queue(targets, values, calldatas, descriptionHash);
      expect(await judgeDAO.state(proposalId)).to.equal(5n); // Queued

      // Immediate execution must revert because timelock delay has not passed
      await expect(
        judgeDAO.execute(targets, values, calldatas, descriptionHash)
      ).to.be.reverted;

      // Fast-forward past the 2-day timelock delay
      await network.provider.send("evm_increaseTime", [TIMELOCK_DELAY_SECONDS + 1]);
      await network.provider.send("evm_mine");

      // Execution succeeds after timelock delay
      await judgeDAO.execute(targets, values, calldatas, descriptionHash);
      expect(await judgeDAO.state(proposalId)).to.equal(7n); // Executed

      // Confirm target received role
      expect(await factory.hasRole(ARBITRATOR_ROLE, nonHolder.address)).to.be.true;
    });
  });
});
