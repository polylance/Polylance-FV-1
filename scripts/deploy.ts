import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

export interface DeploymentAddresses {
  JobEscrowImplementation: string;
  JobFactory: string;
  ReputationSBT: string;
  ProfileRegistry: string;
  GithubReputationRegistry: string;
  TimelockController: string;
  JudgeDAO: string;
  deployedAt: string;
  network: string;
  deployerAddress: string;
}

export async function deployContracts(): Promise<DeploymentAddresses> {
  const [deployer] = await ethers.getSigners();
  const networkObj = await ethers.provider.getNetwork();
  const network = networkObj.name === "unknown" ? "hardhat" : networkObj.name;

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(deploymentsDir, { recursive: true });

  const manifestPath = path.join(deploymentsDir, `${network}_addresses.json`);
  let existing: Record<string, string> = {};
  if (fs.existsSync(manifestPath)) {
    try {
      existing = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      console.log(`Found existing manifest at ${manifestPath}, resuming deployment...`);
    } catch {
      existing = {};
    }
  }

  console.log("═══════════════════════════════════════");
  console.log(" PolyLance MVP Deployment");
  console.log("═══════════════════════════════════════");
  console.log("Network:", network);
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "MATIC/POL");
  console.log("═══════════════════════════════════════\n");

  // ── 1. JobEscrow implementation ──
  let jobEscrowImplAddr = existing.JobEscrowImplementation;
  if (jobEscrowImplAddr) {
    console.log("1/7 JobEscrow implementation already deployed:", jobEscrowImplAddr);
  } else {
    console.log("1/7 Deploying JobEscrow implementation...");
    const JobEscrow = await ethers.getContractFactory("JobEscrow");
    const jobEscrowImpl = await JobEscrow.deploy();
    await jobEscrowImpl.waitForDeployment();
    jobEscrowImplAddr = await jobEscrowImpl.getAddress();
    console.log("    ✓", jobEscrowImplAddr);
    existing.JobEscrowImplementation = jobEscrowImplAddr;
    fs.writeFileSync(manifestPath, JSON.stringify(existing, null, 2));
  }

  // ── 2. ReputationSBT ──
  let sbtAddr = existing.ReputationSBT;
  if (sbtAddr) {
    console.log("2/7 ReputationSBT already deployed:", sbtAddr);
  } else {
    console.log("2/7 Deploying ReputationSBT...");
    const ReputationSBT = await ethers.getContractFactory("ReputationSBT");
    const sbt = await ReputationSBT.deploy(deployer.address);
    await sbt.waitForDeployment();
    sbtAddr = await sbt.getAddress();
    console.log("    ✓", sbtAddr);
    existing.ReputationSBT = sbtAddr;
    fs.writeFileSync(manifestPath, JSON.stringify(existing, null, 2));
  }

  // ── 3. JobFactory ──
  let factoryAddr = existing.JobFactory;
  if (factoryAddr) {
    console.log("3/7 JobFactory already deployed:", factoryAddr);
    const sbtContract = await ethers.getContractAt("ReputationSBT", sbtAddr);
    const MINTER_ROLE = await sbtContract.MINTER_ROLE();
    const hasMinter = await sbtContract.hasRole(MINTER_ROLE, factoryAddr);
    if (hasMinter) {
      console.log("    ✓ Confirmed MINTER_ROLE is already held by JobFactory on ReputationSBT");
    } else {
      console.log("    Granting MINTER_ROLE to JobFactory...");
      let tx = await sbtContract.grantRole(MINTER_ROLE, factoryAddr);
      await tx.wait();
      tx = await sbtContract.revokeRole(MINTER_ROLE, deployer.address);
      await tx.wait();
      console.log("    ✓ MINTER_ROLE moved to JobFactory, revoked from deployer");
    }
  } else {
    console.log("3/7 Deploying JobFactory...");
    const JobFactory = await ethers.getContractFactory("JobFactory");
    const factory = await JobFactory.deploy(jobEscrowImplAddr, sbtAddr);
    await factory.waitForDeployment();
    factoryAddr = await factory.getAddress();
    console.log("    ✓", factoryAddr);
    existing.JobFactory = factoryAddr;
    fs.writeFileSync(manifestPath, JSON.stringify(existing, null, 2));

    const sbtContract = await ethers.getContractAt("ReputationSBT", sbtAddr);
    const MINTER_ROLE = await sbtContract.MINTER_ROLE();
    let tx = await sbtContract.grantRole(MINTER_ROLE, factoryAddr);
    await tx.wait();
    tx = await sbtContract.revokeRole(MINTER_ROLE, deployer.address);
    await tx.wait();
    console.log("    ✓ MINTER_ROLE moved to JobFactory, revoked from deployer");
  }

  // ── 4. ProfileRegistry ──
  let profileRegistryAddr = existing.ProfileRegistry;
  if (profileRegistryAddr) {
    console.log("4/7 ProfileRegistry already deployed:", profileRegistryAddr);
  } else {
    console.log("4/7 Deploying ProfileRegistry...");
    const ProfileRegistry = await ethers.getContractFactory("ProfileRegistry");
    const profileRegistry = await ProfileRegistry.deploy();
    await profileRegistry.waitForDeployment();
    profileRegistryAddr = await profileRegistry.getAddress();
    console.log("    ✓", profileRegistryAddr);
    existing.ProfileRegistry = profileRegistryAddr;
    fs.writeFileSync(manifestPath, JSON.stringify(existing, null, 2));
  }

  // ── 5. GithubReputationRegistry ──
  let githubRegistryAddr = existing.GithubReputationRegistry;
  if (githubRegistryAddr) {
    console.log("5/7 GithubReputationRegistry already deployed:", githubRegistryAddr);
  } else {
    console.log("5/7 Deploying GithubReputationRegistry...");
    const GithubReputationRegistry = await ethers.getContractFactory("GithubReputationRegistry");
    const githubRegistry = await GithubReputationRegistry.deploy();
    await githubRegistry.waitForDeployment();
    githubRegistryAddr = await githubRegistry.getAddress();
    console.log("    ✓", githubRegistryAddr);
    existing.GithubReputationRegistry = githubRegistryAddr;
    fs.writeFileSync(manifestPath, JSON.stringify(existing, null, 2));
  }

  // ── 6. TimelockController (2-day minDelay = 172800s) ──
  let timelockAddr = existing.TimelockController;
  if (timelockAddr) {
    console.log("6/7 TimelockController already deployed:", timelockAddr);
  } else {
    console.log("6/7 Deploying TimelockController (2-day delay)...");
    const TimelockController = await ethers.getContractFactory("TimelockController");
    const timelock = await TimelockController.deploy(
      172800, // 2 days minDelay
      [],     // proposers (granted to JudgeDAO below)
      [ethers.ZeroAddress], // executors (open execution once delay expires)
      deployer.address
    );
    await timelock.waitForDeployment();
    timelockAddr = await timelock.getAddress();
    console.log("    ✓", timelockAddr);
    existing.TimelockController = timelockAddr;
    fs.writeFileSync(manifestPath, JSON.stringify(existing, null, 2));
  }

  // ── 7. JudgeDAO ──
  let judgeDAOAddr = existing.JudgeDAO;
  if (judgeDAOAddr) {
    console.log("7/7 JudgeDAO already deployed:", judgeDAOAddr);
  } else {
    console.log("7/7 Deploying JudgeDAO...");
    const JudgeDAO = await ethers.getContractFactory("JudgeDAO");
    const judgeDAO = await JudgeDAO.deploy(sbtAddr, timelockAddr);
    await judgeDAO.waitForDeployment();
    judgeDAOAddr = await judgeDAO.getAddress();
    console.log("    ✓", judgeDAOAddr);
    existing.JudgeDAO = judgeDAOAddr;
    fs.writeFileSync(manifestPath, JSON.stringify(existing, null, 2));

    const timelockContract = await ethers.getContractAt("TimelockController", timelockAddr);
    const PROPOSER_ROLE = await timelockContract.PROPOSER_ROLE();
    const tx = await timelockContract.grantRole(PROPOSER_ROLE, judgeDAOAddr);
    await tx.wait();
    console.log("    ✓ PROPOSER_ROLE on TimelockController granted to JudgeDAO");
  }

  const addresses: DeploymentAddresses = {
    JobEscrowImplementation: jobEscrowImplAddr,
    JobFactory: factoryAddr,
    ReputationSBT: sbtAddr,
    ProfileRegistry: profileRegistryAddr,
    GithubReputationRegistry: githubRegistryAddr,
    TimelockController: timelockAddr,
    JudgeDAO: judgeDAOAddr,
    deployedAt: new Date().toISOString(),
    network,
    deployerAddress: deployer.address,
  };

  fs.writeFileSync(manifestPath, JSON.stringify(addresses, null, 2));

  if (network === "amoy" || network === "polygonAmoy") {
    const rootPath = path.join(__dirname, "..", "amoy_deployment_addresses.json");
    fs.writeFileSync(
      rootPath,
      JSON.stringify(
        {
          network,
          chainId: "80002",
          deployedAt: addresses.deployedAt,
          deployer: deployer.address,
          contracts: {
            JobEscrowImpl: jobEscrowImplAddr,
            ReputationSBT: sbtAddr,
            JobFactory: factoryAddr,
            ProfileRegistry: profileRegistryAddr,
            GithubReputationRegistry: githubRegistryAddr,
            TimelockController: timelockAddr,
            JudgeDAO: judgeDAOAddr,
          },
        },
        null,
        2
      )
    );
  }

  console.log("\n═══════════════════════════════════════");
  console.log(" Deployment complete. Manifest written to:");
  console.log(" ", manifestPath);
  console.log("═══════════════════════════════════════\n");

  return addresses;
}

if (require.main === module) {
  deployContracts()
    .then(async () => {
      const { bootstrapRoles } = await import("./bootstrap");
      await bootstrapRoles();
    })
    .catch((error) => {
      console.error("Deployment failed:", error);
      process.exitCode = 1;
    });
}
