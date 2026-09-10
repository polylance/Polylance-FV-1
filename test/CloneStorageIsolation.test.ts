import { expect } from "chai";
import { ethers } from "hardhat";
import { JobFactory, ReputationSBT, JobEscrow } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("EIP-1167 clone storage isolation", function () {
  let factory: JobFactory;
  let sbt: ReputationSBT;
  let jobImpl: JobEscrow;
  let clientA: HardhatEthersSigner;
  let clientB: HardhatEthersSigner;

  beforeEach(async function () {
    const signers = await ethers.getSigners();
    const deployer = signers[0];
    clientA = signers[1];
    clientB = signers[2];

    jobImpl = await ethers.deployContract("JobEscrow");
    await jobImpl.waitForDeployment();

    sbt = await ethers.deployContract("ReputationSBT", [deployer.address]);
    await sbt.waitForDeployment();

    factory = await ethers.deployContract("JobFactory", [
      await jobImpl.getAddress(),
      await sbt.getAddress(),
    ]);
    await factory.waitForDeployment();
  });

  it("implementation contract itself cannot be initialized directly (locked by _disableInitializers)", async function () {
    // With _disableInitializers() in the constructor, the bare implementation
    // is permanently locked — even the first initialize() call must revert.
    await expect(
      jobImpl["initialize(address,string,uint256,address)"](clientA.address, "ipfs://impl-test", 604800, ethers.ZeroAddress)
    ).to.be.revertedWithCustomError(jobImpl, "InvalidInitialization");
  });

  it("two clones have fully isolated storage — no cross-contamination", async function () {
    await factory.connect(clientA).postJob("ipfs://jobA", ethers.ZeroAddress);
    await factory.connect(clientB).postJob("ipfs://jobB", ethers.ZeroAddress);

    const jobs = await factory.getAllJobs();
    expect(jobs.length).to.equal(2);

    const jobA = await ethers.getContractAt("JobEscrow", jobs[0]) as JobEscrow;
    const jobB = await ethers.getContractAt("JobEscrow", jobs[1]) as JobEscrow;

    // Fund Job A with 1 ETH
    await jobA.connect(clientA).fundJob(0, { value: ethers.parseEther("1.0") });

    // Job A balance and amount must be 1 ETH
    expect(await jobA.amount()).to.equal(ethers.parseEther("1.0"));

    // Job B must show zero — no storage cross-contamination
    expect(await jobB.amount()).to.equal(0n);
    expect(await jobB.client()).to.equal(clientB.address);
    expect(await jobA.client()).to.equal(clientA.address);
  });
});
