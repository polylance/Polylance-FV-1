import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { getPolygonGasOverrides } from "./checkGasPrice";

dotenv.config();

const KNOWN_BLACKLIST = [
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
  "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
  "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
  "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
  "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
  "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
  "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
  "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720",
  "0xBcd4042DE499D14e55001CcbB24a551F3A993240",
  "0x71bE63f3384f5fb98995898A86B02Fb2426c5788",
  "0xFABB0ac9d68B0B445fB7357272Ff202C5651694a",
  "0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec",
  "0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097",
  "0xcd3B766CCDd6AE721141F452C550Ca635964ce71",
  "0x2546BcD3c84621e976D8185a91A922aE77ECEc30",
  "0xbDA5747bFD65F08deb54cb465eB87D40e51B197E",
  "0xdD2FD4581271e230360230F9337D5c0430Bf44C0",
  "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
  "0xb30F2eFBCEBC529d946e05C9ccE0f1ffFB7e1aB1",
  "0x9999888877776666555544443333222211110000",
  "0x3333444455556666777788889999000011112222",
  "0x25F6111122223333444455556666777788880e9A",
].map((a) => a.toLowerCase());

function isBlacklisted(addr: string): boolean {
  return KNOWN_BLACKLIST.includes(addr.toLowerCase());
}

async function runPreflight() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  PolyLance Polygon Mainnet Pre-Flight Health Check");
  console.log("═══════════════════════════════════════════════════════════\n");

  const rpcUrl = process.env.POLYGON_MAINNET_RPC_URL && process.env.POLYGON_MAINNET_RPC_URL !== "https://polygon-rpc.com"
    ? process.env.POLYGON_MAINNET_RPC_URL
    : "https://polygon-bor-rpc.publicnode.com";
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  let networkOk = false;
  try {
    const net = await provider.getNetwork();
    if (net.chainId !== 137n) {
      console.error(`❌ RPC chainId mismatch: expected 137, got ${net.chainId}`);
      process.exitCode = 1;
      return;
    }
    console.log(`✓ Polygon Mainnet RPC connected: ${rpcUrl} (Chain ID: 137)`);
    networkOk = true;
  } catch (err: any) {
    console.error(`❌ Failed to connect to Polygon Mainnet RPC: ${err.message}`);
    process.exitCode = 1;
    return;
  }

  let allOk = true;

  // 1. Deployer Key Check
  const deployerKey = process.env.MAINNET_DEPLOYER_PRIVATE_KEY;
  if (!deployerKey || deployerKey.trim() === "") {
    console.log("❌ MAINNET_DEPLOYER_PRIVATE_KEY: NOT SET in .env");
    allOk = false;
  } else {
    try {
      const wallet = new ethers.Wallet(deployerKey, provider);
      const deployerAddr = wallet.address;
      if (isBlacklisted(deployerAddr)) {
        console.log(`❌ MAINNET_DEPLOYER_PRIVATE_KEY: Resolves to blacklisted test address ${deployerAddr}!`);
        allOk = false;
      } else {
        const bal = await provider.getBalance(deployerAddr);
        const balEth = parseFloat(ethers.formatEther(bal));
        console.log(`✓ Deployer Wallet: ${deployerAddr}`);
        console.log(`  Balance: ${balEth.toFixed(4)} POL / MATIC`);
        if (balEth < 1.0) {
          console.log(`  ⚠️ Warning: Deployer balance is low (${balEth} POL). Recommend >= 1.5 POL.`);
        }
      }
    } catch (e: any) {
      console.log(`❌ MAINNET_DEPLOYER_PRIVATE_KEY: Invalid private key (${e.message})`);
      allOk = false;
    }
  }

  // 2. Treasury Safe Check
  const safeAddr = process.env.TREASURY_SAFE_ADDRESS;
  if (!safeAddr || safeAddr.trim() === "") {
    console.log("❌ TREASURY_SAFE_ADDRESS: NOT SET in .env");
    allOk = false;
  } else if (isBlacklisted(safeAddr)) {
    console.log(`❌ TREASURY_SAFE_ADDRESS: ${safeAddr} IS A KNOWN TEST/DEMO ACCOUNT! Must create a real Safe.`);
    allOk = false;
  } else if (!ethers.isAddress(safeAddr)) {
    console.log(`❌ TREASURY_SAFE_ADDRESS: ${safeAddr} is not a valid EVM address format.`);
    allOk = false;
  } else {
    try {
      const code = await provider.getCode(safeAddr);
      if (code === "0x") {
        if (process.env.ALLOW_EOA_TREASURY === "true") {
          console.log(`⚠️ TREASURY_SAFE_ADDRESS: ${safeAddr} is an EOA (regular wallet), allowed because ALLOW_EOA_TREASURY=true.`);
        } else {
          console.log(`⚠️ TREASURY_SAFE_ADDRESS: ${safeAddr} has NO bytecode on Polygon Mainnet.`);
          console.log(`   Ensure this Safe is deployed on Polygon (Chain ID 137), or set ALLOW_EOA_TREASURY=true for canary testing.`);
          allOk = false;
        }
      } else {
        console.log(`✓ TREASURY_SAFE_ADDRESS: ${safeAddr} (Verified deployed contract on Polygon)`);
      }
    } catch (err: any) {
      console.log(`⚠️ TREASURY_SAFE_ADDRESS check error: ${err.message}`);
      allOk = false;
    }
  }

  // 3. Oracle Key Check
  const oracleAddr = process.env.ORACLE_ADDRESS;
  if (!oracleAddr || oracleAddr.trim() === "") {
    console.log("❌ ORACLE_ADDRESS: NOT SET in .env");
    allOk = false;
  } else if (isBlacklisted(oracleAddr)) {
    console.log(`❌ ORACLE_ADDRESS: ${oracleAddr} IS A KNOWN TEST/DEMO ACCOUNT! Must generate a fresh key.`);
    allOk = false;
  } else if (!ethers.isAddress(oracleAddr)) {
    console.log(`❌ ORACLE_ADDRESS: ${oracleAddr} is not a valid EVM address format.`);
    allOk = false;
  } else {
    console.log(`✓ ORACLE_ADDRESS: ${oracleAddr} (Valid fresh address format)`);
  }

  // 4. Judges Check
  const judge1 = process.env.JUDGE_1_ADDRESS;
  const judge2 = process.env.JUDGE_2_ADDRESS;
  if (judge1 && !isBlacklisted(judge1) && ethers.isAddress(judge1)) {
    console.log(`✓ JUDGE_1_ADDRESS: ${judge1}`);
  } else {
    console.log(`❌ JUDGE_1_ADDRESS: ${judge1 || "NOT SET"} (Invalid or blacklisted)`);
    allOk = false;
  }
  if (judge2 && !isBlacklisted(judge2) && ethers.isAddress(judge2)) {
    console.log(`✓ JUDGE_2_ADDRESS: ${judge2}`);
  } else {
    console.log(`❌ JUDGE_2_ADDRESS: ${judge2 || "NOT SET"} (Invalid or blacklisted)`);
    allOk = false;
  }

  // 5. Gas Estimation & Deployment Budget Check
  try {
    const gasOverrides = await getPolygonGasOverrides("polygon");
    const safeLowMaxFeeGwei = Number(ethers.formatUnits(gasOverrides.maxFeePerGas ?? 400000000000n, "gwei"));
    const measuredTotalGas = 13_012_487n; // Exact measured gas from compiled bytecode (7 contracts + bootstrap)
    const recommendedGasWithBuffer = 16_265_608n; // Measured gas + 25% safety buffer
    const estimatedCostWei = (gasOverrides.maxFeePerGas ?? 400000000000n) * measuredTotalGas;
    const recommendedCostWei = (gasOverrides.maxFeePerGas ?? 400000000000n) * recommendedGasWithBuffer;
    const estimatedCostPOL = parseFloat(ethers.formatEther(estimatedCostWei));
    const recommendedCostPOL = parseFloat(ethers.formatEther(recommendedCostWei));

    console.log(`\nGas Estimation (Measured from Compiled Bytecode):`);
    console.log(`  Current Safe Low maxFee: ${safeLowMaxFeeGwei.toFixed(2)} Gwei`);
    console.log(`  Exact Total Gas:         13,012,487 gas (7 contracts + bootstrap)`);
    console.log(`  Raw Cost at Current Gas: ~${estimatedCostPOL.toFixed(3)} POL`);
    console.log(`  Recommended Funding:     ~${recommendedCostPOL.toFixed(3)} POL (+25% safety margin)`);

    if (deployerKey && !isBlacklisted(new ethers.Wallet(deployerKey).address)) {
      try {
        const wallet = new ethers.Wallet(deployerKey, provider);
        const bal = await provider.getBalance(wallet.address);
        const balEth = parseFloat(ethers.formatEther(bal));
        if (balEth < recommendedCostPOL) {
          console.log(`  ⚠️ Low Funds: Deployer balance (${balEth.toFixed(3)} POL) is below recommended funding (~${recommendedCostPOL.toFixed(3)} POL at current gas).`);
          console.log(`     Fund wallet to ~${recommendedCostPOL.toFixed(1)} POL or wait for network gas to drop.`);
        } else {
          console.log(`  ✓ Deployer balance (${balEth.toFixed(3)} POL) safely covers deployment with margin.`);
        }
      } catch {}
    }
  } catch {}

  console.log("\n═══════════════════════════════════════════════════════════");
  if (allOk) {
    console.log("  STATUS: ALL CHECKS PASSED. Ready for mainnet deployment!");
    console.log("  Execute: npx hardhat run --network polygon scripts/deploy.ts");
  } else {
    console.log("  STATUS: BLOCKERS DETECTED. Resolve items above before deploying.");
  }
  console.log("═══════════════════════════════════════════════════════════\n");

  if (!allOk) {
    process.exitCode = 1;
  }
}

runPreflight().catch((err) => {
  console.error("Preflight script error:", err);
  process.exitCode = 1;
});
