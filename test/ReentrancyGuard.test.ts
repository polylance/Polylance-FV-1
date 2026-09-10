import { expect } from "chai";
import { ethers, network } from "hardhat";
import { JobFactory, ReputationSBT, JobEscrow, ReentrancyAttacker } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("ReentrancyGuard: real exploit attempts", function () {
  let factory: JobFactory;
  let sbt: ReputationSBT;
  let job: JobEscrow;
  let attacker: ReentrancyAttacker;
  let client: HardhatEthersSigner;
  let judge1: HardhatEthersSigner;

  const REVIEW_PERIOD = 7 * 24 * 60 * 60; // 7 days

  beforeEach(async function () {
    const [deployer, clientSigner, judgeSigner] = await ethers.getSigners();
    client = clientSigner;
    judge1 = judgeSigner;

    const jobImpl = await ethers.deployContract("JobEscrow");
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

    const ARBITRATOR_ROLE = await factory.ARBITRATOR_ROLE();
    await factory.grantRole(ARBITRATOR_ROLE, judge1.address);

    // Deploy the real attacker contract — plays the role of a malicious freelancer
    attacker = await ethers.deployContract("ReentrancyAttacker");
    await attacker.waitForDeployment();

    // Post and fund a real job
    await factory.connect(client).postJob("ipfs://job-description", ethers.ZeroAddress);
    const jobs = await factory.getAllJobs();
    job = await ethers.getContractAt("JobEscrow", jobs[0]) as JobEscrow;
    await attacker.setTarget(jobs[0]);

    await job.connect(client).fundJob(0, { value: ethers.parseEther("1.0") });

    // Attacker contract applies as freelancer
    await attacker.triggerApply();
  });

  it("blocks re-entrant releasePayment call during payout (nonReentrant holds)", async function () {
    const attackerAddress = await attacker.getAddress();
    await job.connect(client).selectFreelancer(attackerAddress);
    await attacker.triggerSubmitWork();

    await attacker.setAttackMode(1); // attempt to re-enter releasePayment

    // The outer call must succeed (legitimate release), but the re-entrant attempt inside receive() must be blocked
    await job.connect(client).releasePayment();

    expect(await attacker.reentryAttempts()).to.equal(1n);
    expect(await attacker.reentryReverted()).to.be.true;

    // Critical assertion: the job's remaining balance reflects exactly ONE payout having occurred
    const jobBalanceAfter = await ethers.provider.getBalance(await job.getAddress());
    expect(jobBalanceAfter).to.equal(0n); // fully paid out once, no dust, no double-pay
  });

  it("blocks re-entrant claimAutoRelease during payout", async function () {
    const attackerAddress = await attacker.getAddress();
    await job.connect(client).selectFreelancer(attackerAddress);
    await attacker.triggerSubmitWork();

    await network.provider.send("evm_increaseTime", [REVIEW_PERIOD + 1]);
    await network.provider.send("evm_mine");

    await attacker.setAttackMode(2); // attempt to re-enter claimAutoRelease
    await job.connect(client).claimAutoRelease();

    expect(await attacker.reentryReverted()).to.be.true;
    expect(await job.status()).to.equal(4n); // Completed, exactly once
  });

  it("blocks re-entrant call during dispute resolution payout", async function () {
    const attackerAddress = await attacker.getAddress();
    await job.connect(client).selectFreelancer(attackerAddress);
    await attacker.triggerSubmitWork();
    await job.connect(client).raiseDispute(0, "ipfs://evidence");

    await attacker.setAttackMode(1); // attacker tries to re-enter during the judge's payout tx

    await job.connect(judge1).resolveDispute(10000, "ipfs://reasoning");

    expect(await attacker.reentryReverted()).to.be.true;
    // Confirm no double-payout happened via resolveDispute's own path
    expect(await job.status()).to.equal(4n);
  });
});
