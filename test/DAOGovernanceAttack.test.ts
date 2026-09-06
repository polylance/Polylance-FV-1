import { expect } from "chai";
import { ethers } from "hardhat";
import { mine } from "@nomicfoundation/hardhat-network-helpers";
import { JudgeDAO, ReputationSBT, JobFactory, JobEscrow, TimelockController } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("Phase 7 — Governance attack surface", function () {
  let judgeDAO: JudgeDAO;
  let timelock: TimelockController;
  let sbt: ReputationSBT;
  let factory: JobFactory;
  let jobImpl: JobEscrow;
  let deployer: HardhatEthersSigner;
  let holder1: HardhatEthersSigner;
  let maliciousCandidate: HardhatEthersSigner;

  const VOTING_DELAY_BLOCKS = 86400;
  const VOTING_PERIOD_BLOCKS = 7 * 86400;
  const TIMELOCK_DELAY_SECONDS = 2 * 24 * 60 * 60;

  beforeEach(async function () {
    [deployer, holder1, maliciousCandidate] = await ethers.getSigners();

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
    await sbt.grantRole(MINTER_ROLE, deployer.address);

    // Mint 1 SBT to holder1 to give them 1 vote
    await sbt.mint(holder1.address, ethers.ZeroAddress);

    timelock = await ethers.deployContract("TimelockController", [
      TIMELOCK_DELAY_SECONDS,
      [],
      [ethers.ZeroAddress],
      deployer.address,
    ]);
    await timelock.waitForDeployment();

    judgeDAO = await ethers.deployContract("JudgeDAO", [
      await sbt.getAddress(),
      await timelock.getAddress(),
    ]);
    await judgeDAO.waitForDeployment();

    const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
    await timelock.grantRole(PROPOSER_ROLE, await judgeDAO.getAddress());

    const DEFAULT_ADMIN_ROLE = await factory.DEFAULT_ADMIN_ROLE();
    await factory.grantRole(DEFAULT_ADMIN_ROLE, await timelock.getAddress());
  });

  it("proves quorum percentage risk: a single SBT holder can pass a proposal when total active supply is low", async function () {
    const ARBITRATOR_ROLE = await factory.ARBITRATOR_ROLE();
    const calldata = factory.interface.encodeFunctionData("grantRole", [
      ARBITRATOR_ROLE,
      maliciousCandidate.address,
    ]);
    const description = "Malicious Proposal: Add Rogue Judge";
    const descriptionHash = ethers.id(description);

    // Holder1 creates proposal alone
    const proposeTx = await judgeDAO.connect(holder1).propose(
      [await factory.getAddress()],
      [0],
      [calldata],
      description
    );
    const receipt = await proposeTx.wait();
    const event = receipt?.logs
      .map((l) => {
        try { return judgeDAO.interface.parseLog(l as any); } catch { return null; }
      })
      .find((e) => e?.name === "ProposalCreated");

    const proposalId = event!.args.proposalId as bigint;

    // Advance past voting delay
    await mine(VOTING_DELAY_BLOCKS + 1);

    // Cast vote (1 = For)
    await judgeDAO.connect(holder1).castVote(proposalId, 1);

    // Advance past voting period
    await mine(VOTING_PERIOD_BLOCKS + 1);

    // Proposal passes
    expect(await judgeDAO.state(proposalId)).to.equal(4n); // Succeeded

    // Queue proposal into TimelockController
    await judgeDAO.queue([await factory.getAddress()], [0], [calldata], descriptionHash);

    // Advance past timelock delay
    await network.provider.send("evm_increaseTime", [TIMELOCK_DELAY_SECONDS + 1]);
    await network.provider.send("evm_mine");

    // Execution succeeds
    await judgeDAO.execute(
      [await factory.getAddress()],
      [0],
      [calldata],
      descriptionHash
    );

    // Malicious candidate now holds ARBITRATOR_ROLE — confirming bootstrap quorum behavior
    expect(await factory.hasRole(ARBITRATOR_ROLE, maliciousCandidate.address)).to.be.true;
  });
});
