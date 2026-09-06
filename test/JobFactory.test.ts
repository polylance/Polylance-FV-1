import { expect } from "chai";
import { ethers, network } from "hardhat";
import { JobFactory, ReputationSBT, JobEscrow } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("JobFactory Core & Access Controls", function () {
  let factory: JobFactory;
  let sbt: ReputationSBT;
  let jobImpl: JobEscrow;
  let deployer: HardhatEthersSigner;
  let client: HardhatEthersSigner;
  let freelancer: HardhatEthersSigner;
  let attacker: HardhatEthersSigner;

  beforeEach(async function () {
    [deployer, client, freelancer, attacker] = await ethers.getSigners();

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
  });

  describe("postJob & isJobContract", function () {
    it("deploys a real clone with a distinct address per job", async function () {
      await factory.connect(client).postJob("ipfs://desc1", ethers.ZeroAddress);
      await factory.connect(client).postJob("ipfs://desc2", ethers.ZeroAddress);

      const jobs = await factory.getAllJobs();
      expect(jobs.length).to.equal(2);
      expect(jobs[0]).to.not.equal(jobs[1]);
    });

    it("registers the clone as a known job contract", async function () {
      await factory.connect(client).postJob("ipfs://desc1", ethers.ZeroAddress);
      const jobs = await factory.getAllJobs();
      expect(await factory.isJobContract(jobs[0])).to.be.true;
      expect(await factory.isJob(jobs[0])).to.be.true;
    });

    it("rejects a random address as a job contract", async function () {
      expect(await factory.isJobContract(attacker.address)).to.be.false;
      expect(await factory.isJob(attacker.address)).to.be.false;
    });
  });

  describe("Security: mintReputationSBT access control (Section 1 fix)", function () {
    it("rejects mintReputationSBT called by a non-job address", async function () {
      await expect(
        factory.connect(attacker).mintReputationSBT(attacker.address, attacker.address)
      ).to.be.revertedWith("Only registered job contracts");
    });

    it("rejects a registered job contract minting for a DIFFERENT job address", async function () {
      await factory.connect(client).postJob("ipfs://desc1", ethers.ZeroAddress);
      const jobs = await factory.getAllJobs();

      // Impersonate job 0
      const jobSigner = await ethers.getImpersonatedSigner(jobs[0]);
      await network.provider.send("hardhat_setBalance", [
        jobs[0],
        "0x1000000000000000000",
      ]);

      await expect(
        factory.connect(jobSigner).mintReputationSBT(freelancer.address, attacker.address)
      ).to.be.revertedWith("Job contract must mint for itself");
    });

    it("allows a real job contract to mint for itself", async function () {
      await factory.connect(client).postJob("ipfs://desc1", ethers.ZeroAddress);
      const jobs = await factory.getAllJobs();

      const jobSigner = await ethers.getImpersonatedSigner(jobs[0]);
      await network.provider.send("hardhat_setBalance", [
        jobs[0],
        "0x1000000000000000000",
      ]);

      await expect(
        factory.connect(jobSigner).mintReputationSBT(freelancer.address, jobs[0])
      ).to.not.be.reverted;

      expect(await sbt.balanceOf(freelancer.address)).to.equal(1n);
    });
  });

  describe("Security: collectFee access control", function () {
    it("rejects collectFee called by a non-job address", async function () {
      await expect(
        factory.connect(attacker).collectFee(ethers.ZeroAddress, 0, { value: ethers.parseEther("1.0") })
      ).to.be.revertedWith("Only registered job contracts");
    });
  });

  describe("Treasury", function () {
    it("only TREASURY_ADMIN_ROLE can withdraw", async function () {
      await expect(
        factory.connect(attacker).withdrawTreasury(ethers.ZeroAddress, attacker.address, ethers.parseEther("1.0"))
      ).to.be.revertedWithCustomError(factory, "AccessControlUnauthorizedAccount");
    });

    it("cannot withdraw more than treasuryBalance", async function () {
      const TREASURY_ADMIN_ROLE = await factory.TREASURY_ADMIN_ROLE();
      await factory.grantRole(TREASURY_ADMIN_ROLE, deployer.address);

      await expect(
        factory.withdrawTreasury(ethers.ZeroAddress, deployer.address, ethers.parseEther("1000.0"))
      ).to.be.revertedWith("Insufficient treasury balance");
    });
  });
});
