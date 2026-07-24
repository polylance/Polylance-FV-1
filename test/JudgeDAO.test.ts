import { expect } from "chai";
import { ethers } from "hardhat";
import { mine, time } from "@nomicfoundation/hardhat-network-helpers";
import { JudgeDAO, ReputationSBT, JobFactory, JobEscrow } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("JudgeDAO", function () {
  let judgeDAO: JudgeDAO;
  let sbt: ReputationSBT;
  let factory: JobFactory;
  let jobImpl: JobEscrow;
  let deployer: HardhatEthersSigner;
  let sbtHolder: HardhatEthersSigner;
  let nonHolder: HardhatEthersSigner;

  // GovernorSettings: votingDelay = 1 day, votingPeriod = 7 days
  // On Hardhat, block time = 1s by default, so 1 day = 86400 blocks
  const VOTING_DELAY_BLOCKS = 86400;
  const VOTING_PERIOD_BLOCKS = 7 * 86400;

  beforeEach(async function () {
    [deployer, sbtHolder, nonHolder] = await ethers.getSigners();

    // Deploy the full stack
    jobImpl = await ethers.deployContract("JobEscrow");
    await jobImpl.waitForDeployment();

    sbt = await ethers.deployContract("ReputationSBT", [ethers.ZeroAddress]);
    await sbt.waitForDeployment();

    factory = await ethers.deployContract("JobFactory", [
      await jobImpl.getAddress(),
      await sbt.getAddress(),
    ]);
    await factory.waitForDeployment();

    // Grant MINTER_ROLE to factory
    const MINTER_ROLE = await sbt.MINTER_ROLE();
    await sbt.grantRole(MINTER_ROLE, await factory.getAddress());

    judgeDAO = await ethers.deployContract("JudgeDAO", [await sbt.getAddress()]);
    await judgeDAO.waitForDeployment();

    // Mint an SBT to `deployer` by completing a job as freelancer
    // sbtHolder acts as client, deployer acts as freelancer
    const tx = await factory.connect(sbtHolder).postJob("QmJob");
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
    await job.connect(sbtHolder).fundJob({ value: ethers.parseEther("1") });
    await job.connect(deployer).submitWork("Done", "desc", ["QmEv"]);
    await job.connect(sbtHolder).releasePayment();

    // `deployer` now holds 1 SBT with self-delegated voting power
  });

  // ── Helpers ─────────────────────────────────────────────────────────────────

  async function buildGrantRoleCalldata(target: string) {
    const ARBITRATOR_ROLE = await factory.ARBITRATOR_ROLE();
    return factory.interface.encodeFunctionData("grantRole", [ARBITRATOR_ROLE, target]);
  }

  async function createArbitratorProposal(
    proposer: HardhatEthersSigner,
    target: string
  ): Promise<bigint> {
    const calldata = await buildGrantRoleCalldata(target);
    const description = `Grant ARBITRATOR_ROLE to ${target}`;

    const tx = await judgeDAO.connect(proposer).propose(
      [await factory.getAddress()],
      [0],
      [calldata],
      description
    );
    const receipt = await tx.wait();
    const event = receipt?.logs
      .map((log) => {
        try { return judgeDAO.interface.parseLog(log as any); } catch { return null; }
      })
      .find((e) => e?.name === "ProposalCreated");

    return event!.args.proposalId as bigint;
  }

  // ── SBT holder can propose ──────────────────────────────────────────────────

  it("SBT holder can create a proposal", async function () {
    const votingPower = await sbt.getVotes(deployer.address);
    expect(votingPower).to.be.gte(1n);

    const proposalId = await createArbitratorProposal(deployer, nonHolder.address);
    expect(proposalId).to.be.gt(0n);

    // Proposal state: 0 = Pending
    expect(await judgeDAO.state(proposalId)).to.equal(0n);
  });

  // ── Non-holder cannot propose ───────────────────────────────────────────────

  it("non-SBT holder cannot create a proposal (below threshold)", async function () {
    const votingPower = await sbt.getVotes(nonHolder.address);
    expect(votingPower).to.equal(0n);

    const calldata = await buildGrantRoleCalldata(nonHolder.address);

    await expect(
      judgeDAO.connect(nonHolder).propose(
        [await factory.getAddress()],
        [0],
        [calldata],
        "Grant role to nonHolder"
      )
    ).to.be.revertedWithCustomError(judgeDAO, "GovernorInsufficientProposerVotes");
  });

  // ── Successful vote grants ARBITRATOR_ROLE on execute ──────────────────────

  it("successful vote executes and grants ARBITRATOR_ROLE", async function () {
    // Grant factory's DEFAULT_ADMIN_ROLE to JudgeDAO so it can execute grantRole
    const DEFAULT_ADMIN_ROLE = await factory.DEFAULT_ADMIN_ROLE();
    await factory.connect(deployer).grantRole(DEFAULT_ADMIN_ROLE, await judgeDAO.getAddress());

    // Create proposal
    const proposalId = await createArbitratorProposal(deployer, nonHolder.address);

    // State: 0 = Pending — advance past votingDelay (block-based in GovernorSettings)
    // votingDelay() returns seconds (1 day). Hardhat automine means 1 block ≈ 1s.
    // We mine enough blocks to pass the delay.
    await mine(VOTING_DELAY_BLOCKS + 1);

    // State should now be Active (1)
    expect(await judgeDAO.state(proposalId)).to.equal(1n);

    // Cast vote: 1 = For
    await judgeDAO.connect(deployer).castVote(proposalId, 1);

    // Advance past votingPeriod
    await mine(VOTING_PERIOD_BLOCKS + 1);

    // State should be Succeeded (4)
    expect(await judgeDAO.state(proposalId)).to.equal(4n);

    // Execute
    const ARBITRATOR_ROLE = await factory.ARBITRATOR_ROLE();
    const calldata = factory.interface.encodeFunctionData("grantRole", [
      ARBITRATOR_ROLE,
      nonHolder.address,
    ]);

    // Compute descriptionHash — must match exactly what was passed to propose()
    const description = `Grant ARBITRATOR_ROLE to ${nonHolder.address}`;
    const descriptionHash = ethers.id(description);

    await judgeDAO.connect(deployer).execute(
      [await factory.getAddress()],
      [0],
      [calldata],
      descriptionHash
    );

    // Verify ARBITRATOR_ROLE was granted
    expect(await factory.hasRole(ARBITRATOR_ROLE, nonHolder.address)).to.be.true;
  });
});
