import { ethers } from "hardhat";

async function measureDeploymentGas() {
  console.log("══════════════════════════════════════════════════════════════════════");
  console.log("  PolyLance: Exact Deployment & Bootstrap Gas Measurement (Bytecode)");
  console.log("══════════════════════════════════════════════════════════════════════\n");

  const [deployer, judge1, judge2, safe, oracle] = await ethers.getSigners();
  const gasLog: { step: string; contractOrAction: string; gasUsed: bigint }[] = [];

  // 1. JobEscrow Implementation
  const JobEscrow = await ethers.getContractFactory("JobEscrow");
  const jobEscrowDeployTx = await JobEscrow.getDeployTransaction();
  const jobEscrowEstGas = await ethers.provider.estimateGas(jobEscrowDeployTx);
  const jobEscrow = await JobEscrow.deploy();
  const jobEscrowReceipt = await jobEscrow.deploymentTransaction()?.wait();
  const jobEscrowGas = jobEscrowReceipt?.gasUsed ?? jobEscrowEstGas;
  gasLog.push({ step: "1/7", contractOrAction: "Deploy JobEscrow (Impl)", gasUsed: jobEscrowGas });

  // 2. ReputationSBT
  const ReputationSBT = await ethers.getContractFactory("ReputationSBT");
  const sbtDeployTx = await ReputationSBT.getDeployTransaction(deployer.address);
  const sbtEstGas = await ethers.provider.estimateGas(sbtDeployTx);
  const sbt = await ReputationSBT.deploy(deployer.address);
  const sbtReceipt = await sbt.deploymentTransaction()?.wait();
  const sbtGas = sbtReceipt?.gasUsed ?? sbtEstGas;
  gasLog.push({ step: "2/7", contractOrAction: "Deploy ReputationSBT", gasUsed: sbtGas });

  // 3. JobFactory
  const JobFactory = await ethers.getContractFactory("JobFactory");
  const factoryDeployTx = await JobFactory.getDeployTransaction(await jobEscrow.getAddress(), await sbt.getAddress());
  const factoryEstGas = await ethers.provider.estimateGas(factoryDeployTx);
  const factory = await JobFactory.deploy(await jobEscrow.getAddress(), await sbt.getAddress());
  const factoryReceipt = await factory.deploymentTransaction()?.wait();
  const factoryGas = factoryReceipt?.gasUsed ?? factoryEstGas;
  gasLog.push({ step: "3/7", contractOrAction: "Deploy JobFactory", gasUsed: factoryGas });

  // 3b. Minter Role handoff
  const MINTER_ROLE = await sbt.MINTER_ROLE();
  const grantMinterTx = await sbt.grantRole(MINTER_ROLE, await factory.getAddress());
  const grantMinterReceipt = await grantMinterTx.wait();
  gasLog.push({ step: "3b", contractOrAction: "SBT grantRole(MINTER_ROLE, Factory)", gasUsed: grantMinterReceipt!.gasUsed });

  const revokeMinterTx = await sbt.revokeRole(MINTER_ROLE, deployer.address);
  const revokeMinterReceipt = await revokeMinterTx.wait();
  gasLog.push({ step: "3c", contractOrAction: "SBT revokeRole(MINTER_ROLE, Deployer)", gasUsed: revokeMinterReceipt!.gasUsed });

  // 4. ProfileRegistry
  const ProfileRegistry = await ethers.getContractFactory("ProfileRegistry");
  const profileDeployTx = await ProfileRegistry.getDeployTransaction();
  const profileEstGas = await ethers.provider.estimateGas(profileDeployTx);
  const profileRegistry = await ProfileRegistry.deploy();
  const profileReceipt = await profileRegistry.deploymentTransaction()?.wait();
  const profileGas = profileReceipt?.gasUsed ?? profileEstGas;
  gasLog.push({ step: "4/7", contractOrAction: "Deploy ProfileRegistry", gasUsed: profileGas });

  // 5. GithubReputationRegistry
  const GithubRegistry = await ethers.getContractFactory("GithubReputationRegistry");
  const githubDeployTx = await GithubRegistry.getDeployTransaction();
  const githubEstGas = await ethers.provider.estimateGas(githubDeployTx);
  const githubRegistry = await GithubRegistry.deploy();
  const githubReceipt = await githubRegistry.deploymentTransaction()?.wait();
  const githubGas = githubReceipt?.gasUsed ?? githubEstGas;
  gasLog.push({ step: "5/7", contractOrAction: "Deploy GithubReputationRegistry", gasUsed: githubGas });

  // 6. TimelockController
  const TimelockController = await ethers.getContractFactory("TimelockController");
  const timelockDeployTx = await TimelockController.getDeployTransaction(172800, [], [ethers.ZeroAddress], deployer.address);
  const timelockEstGas = await ethers.provider.estimateGas(timelockDeployTx);
  const timelock = await TimelockController.deploy(172800, [], [ethers.ZeroAddress], deployer.address);
  const timelockReceipt = await timelock.deploymentTransaction()?.wait();
  const timelockGas = timelockReceipt?.gasUsed ?? timelockEstGas;
  gasLog.push({ step: "6/7", contractOrAction: "Deploy TimelockController", gasUsed: timelockGas });

  // 7. JudgeDAO
  const JudgeDAO = await ethers.getContractFactory("JudgeDAO");
  const judgeDAODeployTx = await JudgeDAO.getDeployTransaction(await sbt.getAddress(), await timelock.getAddress());
  const judgeDAOEstGas = await ethers.provider.estimateGas(judgeDAODeployTx);
  const judgeDAO = await JudgeDAO.deploy(await sbt.getAddress(), await timelock.getAddress());
  const judgeDAOReceipt = await judgeDAO.deploymentTransaction()?.wait();
  const judgeDAOGas = judgeDAOReceipt?.gasUsed ?? judgeDAOEstGas;
  gasLog.push({ step: "7/7", contractOrAction: "Deploy JudgeDAO", gasUsed: judgeDAOGas });

  // 7b. Timelock Proposer handoff
  const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
  const grantProposerTx = await timelock.grantRole(PROPOSER_ROLE, await judgeDAO.getAddress());
  const grantProposerReceipt = await grantProposerTx.wait();
  gasLog.push({ step: "7b", contractOrAction: "Timelock grantRole(PROPOSER, JudgeDAO)", gasUsed: grantProposerReceipt!.gasUsed });

  // 8. Bootstrap Transactions
  const ARBITRATOR_ROLE = await factory.ARBITRATOR_ROLE();
  const TREASURY_ADMIN_ROLE = await factory.TREASURY_ADMIN_ROLE();
  const ORACLE_OPERATOR_ROLE = await githubRegistry.ORACLE_OPERATOR_ROLE();

  const grantArb1Tx = await factory.grantRole(ARBITRATOR_ROLE, judge1.address);
  gasLog.push({ step: "Boot 1", contractOrAction: "grantRole(ARBITRATOR, Judge 1)", gasUsed: (await grantArb1Tx.wait())!.gasUsed });

  const grantArb2Tx = await factory.grantRole(ARBITRATOR_ROLE, judge2.address);
  gasLog.push({ step: "Boot 2", contractOrAction: "grantRole(ARBITRATOR, Judge 2)", gasUsed: (await grantArb2Tx.wait())!.gasUsed });

  const grantSafeTx = await factory.grantRole(TREASURY_ADMIN_ROLE, safe.address);
  gasLog.push({ step: "Boot 3", contractOrAction: "grantRole(TREASURY_ADMIN, Safe)", gasUsed: (await grantSafeTx.wait())!.gasUsed });

  const grantOracleTx = await githubRegistry.grantRole(ORACLE_OPERATOR_ROLE, oracle.address);
  gasLog.push({ step: "Boot 4", contractOrAction: "grantRole(ORACLE_OPERATOR, Oracle)", gasUsed: (await grantOracleTx.wait())!.gasUsed });

  const approveUsdcTx = await factory.setApprovedPaymentToken("0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", true);
  gasLog.push({ step: "Boot 5", contractOrAction: "setApprovedPaymentToken(USDC)", gasUsed: (await approveUsdcTx.wait())!.gasUsed });

  const approveUsdtTx = await factory.setApprovedPaymentToken("0xc2132D05D31c914a87C6611C10748AEb04B58e8F", true);
  gasLog.push({ step: "Boot 6", contractOrAction: "setApprovedPaymentToken(USDT)", gasUsed: (await approveUsdtTx.wait())!.gasUsed });

  // Display Itemized Table
  console.log("----------------------------------------------------------------------");
  console.log(String("Step").padEnd(10) + String("Contract / Action").padEnd(42) + String("Exact Gas Used").padStart(16));
  console.log("----------------------------------------------------------------------");

  let totalGas = 0n;
  for (const item of gasLog) {
    totalGas += item.gasUsed;
    console.log(
      item.step.padEnd(10) +
      item.contractOrAction.padEnd(42) +
      item.gasUsed.toLocaleString().padStart(16)
    );
  }
  console.log("----------------------------------------------------------------------");
  console.log(String("TOTAL").padEnd(52) + totalGas.toLocaleString().padStart(16) + " gas\n");

  // Query Live Polygon Gas Station for exact real-time costs
  let liveMaxFeeGwei = 395.0;
  try {
    const res = await fetch("https://gasstation.polygon.technology/v2");
    if (res.ok) {
      const data = await res.json();
      liveMaxFeeGwei = Number(data.safeLow?.maxFee ?? 395.0);
    }
  } catch {}

  const tiers = [
    { label: "Quiet Night / Low Window (35 Gwei)", gwei: 35 },
    { label: "Normal Working Day (80 Gwei)", gwei: 80 },
    { label: "Elevated Network (200 Gwei)", gwei: 200 },
    { label: `Current Live Safe Low (${liveMaxFeeGwei.toFixed(1)} Gwei)`, gwei: liveMaxFeeGwei },
  ];

  console.log("══════════════════════════════════════════════════════════════════════");
  console.log("  Real Cost in POL Across Gas Windows (Measured from Bytecode)");
  console.log("══════════════════════════════════════════════════════════════════════");

  for (const t of tiers) {
    const costWei = totalGas * ethers.parseUnits(t.gwei.toFixed(2), "gwei");
    const costPOL = parseFloat(ethers.formatEther(costWei));
    const withMarginPOL = costPOL * 1.25; // 25% safety margin
    console.log(`• ${t.label}:`);
    console.log(`  Raw Cost:     ${costPOL.toFixed(4)} POL`);
    console.log(`  +25% Margin:  ${withMarginPOL.toFixed(4)} POL (Recommended Funding)`);
  }

  console.log("══════════════════════════════════════════════════════════════════════\n");
}

measureDeploymentGas().catch(console.error);
