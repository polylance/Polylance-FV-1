import { expect } from "chai";
import { ethers } from "hardhat";
import { JobFactory, ReputationSBT, JobEscrow } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("Phase 4 — Cross-contract call verification", function () {
  let factory: JobFactory;
  let sbt: ReputationSBT;
  let jobImpl: JobEscrow;
  let job: JobEscrow;
  let client: HardhatEthersSigner;
  let freelancer: HardhatEthersSigner;
  let judge1: HardhatEthersSigner;

  beforeEach(async function () {
    const signers = await ethers.getSigners();
    const deployer = signers[0];
    client = signers[1];
    freelancer = signers[2];
    judge1 = signers[3];

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

    const ARBITRATOR_ROLE = await factory.ARBITRATOR_ROLE();
    await factory.grantRole(ARBITRATOR_ROLE, judge1.address);

    await factory.connect(client).postJob("ipfs://job-description", ethers.ZeroAddress);
    const jobs = await factory.getAllJobs();
    job = await ethers.getContractAt("JobEscrow", jobs[0]) as JobEscrow;

    await job.connect(client).fundJob(0, { value: ethers.parseEther("1.0") });
    await job.connect(freelancer).applyToJob("ipfs://proposal");
    await job.connect(client).selectFreelancer(freelancer.address);
    await job.connect(freelancer).submitWork("Delivery", "Done", ["ipfs://evidence"]);
    await job.connect(client).raiseDispute(0, "ipfs://evidence");
  });

  it("resolveDispute's cross-contract hasRole check to JobFactory actually works and doesn't excessively burn gas", async function () {
    const tx = await job.connect(judge1).resolveDispute(5000, "ipfs://reasoning");
    const receipt = await tx.wait();

    console.log("Gas used for resolveDispute with cross-contract role check & SBT mint:", receipt!.gasUsed.toString());
    expect(receipt!.gasUsed).to.be.lessThan(450000n);
    expect(await job.status()).to.equal(4n); // Completed
  });
});
