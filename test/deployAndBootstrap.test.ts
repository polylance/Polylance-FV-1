import { expect } from "chai";
import { ethers } from "hardhat";
import { deployContracts } from "../scripts/deploy";
import { bootstrapRoles } from "../scripts/bootstrap";
import * as fs from "fs";
import * as path from "path";

describe("Deployment & Bootstrap Scripts Pipeline", function () {
  let judge1: any;
  let judge2: any;
  let treasurySafe: any;
  let oracle: any;
  let deployer: any;

  const originalEnv = { ...process.env };

  before(async function () {
    [deployer] = await ethers.getSigners();
    judge1 = ethers.Wallet.createRandom();
    judge2 = ethers.Wallet.createRandom();
    treasurySafe = ethers.Wallet.createRandom();
    oracle = ethers.Wallet.createRandom();
  });

  beforeEach(function () {
    const manifestPath = path.join(__dirname, "..", "deployments", "hardhat_addresses.json");
    if (fs.existsSync(manifestPath)) {
      fs.unlinkSync(manifestPath);
    }
  });

  afterEach(function () {
    process.env = { ...originalEnv };
    const manifestPath = path.join(__dirname, "..", "deployments", "hardhat_addresses.json");
    if (fs.existsSync(manifestPath)) {
      fs.unlinkSync(manifestPath);
    }
  });

  it("should deploy all 6 contracts and write deployment manifest to deployments/hardhat_addresses.json", async function () {
    const addresses = await deployContracts();

    expect(addresses.JobEscrowImplementation).to.be.properAddress;
    expect(addresses.JobFactory).to.be.properAddress;
    expect(addresses.ReputationSBT).to.be.properAddress;
    expect(addresses.ProfileRegistry).to.be.properAddress;
    expect(addresses.GithubReputationRegistry).to.be.properAddress;
    expect(addresses.TimelockController).to.be.properAddress;
    expect(addresses.JudgeDAO).to.be.properAddress;

    const manifestPath = path.join(__dirname, "..", "deployments", "hardhat_addresses.json");
    expect(fs.existsSync(manifestPath)).to.be.true;

    // Verify MINTER_ROLE on ReputationSBT is held by JobFactory, NOT deployer
    const sbt = await ethers.getContractAt("ReputationSBT", addresses.ReputationSBT);
    const MINTER_ROLE = await sbt.MINTER_ROLE();
    expect(await sbt.hasRole(MINTER_ROLE, addresses.JobFactory)).to.be.true;
    expect(await sbt.hasRole(MINTER_ROLE, deployer.address)).to.be.false;
  });

  it("should fail bootstrap if required env vars are missing", async function () {
    delete process.env.JUDGE_1_ADDRESS;
    delete process.env.JUDGE_2_ADDRESS;
    delete process.env.TREASURY_SAFE_ADDRESS;
    delete process.env.ORACLE_ADDRESS;

    await expect(bootstrapRoles()).to.be.rejectedWith("SECURITY EXCEPTION: JUDGE_1_ADDRESS is not set in environment");
  });

  it("should execute full bootstrap pipeline, grant roles, and pass on-chain verification", async function () {
    const addresses = await deployContracts();

    process.env.JUDGE_1_ADDRESS = judge1.address;
    process.env.JUDGE_2_ADDRESS = judge2.address;
    process.env.TREASURY_SAFE_ADDRESS = treasurySafe.address;
    process.env.ORACLE_ADDRESS = oracle.address;
    process.env.TRANSFER_ADMIN_TO_SAFE = "false";

    const success = await bootstrapRoles();
    expect(success).to.be.true;

    const factory = await ethers.getContractAt("JobFactory", addresses.JobFactory);
    const githubRegistry = await ethers.getContractAt("GithubReputationRegistry", addresses.GithubReputationRegistry);

    const ARBITRATOR_ROLE = await factory.ARBITRATOR_ROLE();
    const TREASURY_ADMIN_ROLE = await factory.TREASURY_ADMIN_ROLE();
    const ORACLE_OPERATOR_ROLE = await githubRegistry.ORACLE_OPERATOR_ROLE();

    expect(await factory.hasRole(ARBITRATOR_ROLE, judge1.address)).to.be.true;
    expect(await factory.hasRole(ARBITRATOR_ROLE, judge2.address)).to.be.true;
    expect(await factory.hasRole(TREASURY_ADMIN_ROLE, treasurySafe.address)).to.be.true;
    expect(await githubRegistry.hasRole(ORACLE_OPERATOR_ROLE, oracle.address)).to.be.true;
  });

  it("should transfer DEFAULT_ADMIN_ROLE to Safe and renounce deployer role when TRANSFER_ADMIN_TO_SAFE is true", async function () {
    const addresses = await deployContracts();

    process.env.JUDGE_1_ADDRESS = judge1.address;
    process.env.JUDGE_2_ADDRESS = judge2.address;
    process.env.TREASURY_SAFE_ADDRESS = treasurySafe.address;
    process.env.ORACLE_ADDRESS = oracle.address;
    process.env.TRANSFER_ADMIN_TO_SAFE = "true";

    const success = await bootstrapRoles();
    expect(success).to.be.true;

    const factory = await ethers.getContractAt("JobFactory", addresses.JobFactory);
    const DEFAULT_ADMIN_ROLE = await factory.DEFAULT_ADMIN_ROLE();

    expect(await factory.hasRole(DEFAULT_ADMIN_ROLE, treasurySafe.address)).to.be.true;
    expect(await factory.hasRole(DEFAULT_ADMIN_ROLE, deployer.address)).to.be.false;
  });
});
