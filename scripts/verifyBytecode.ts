import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
  const networkObj = await ethers.provider.getNetwork();
  const network = networkObj.name === "unknown" ? "hardhat" : networkObj.name;
  const manifestPath = fs.existsSync(`./deployments/${network}_addresses.json`)
    ? `./deployments/${network}_addresses.json`
    : "./deployments/hardhat_addresses.json";
  const addresses = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  
  console.log("═══════════════════════════════════════");
  console.log(" Verifying Bytecode on Polygon Amoy");
  console.log("═══════════════════════════════════════");

  for (const [key, addr] of Object.entries(addresses)) {
    if (typeof addr === "string" && addr.startsWith("0x") && addr.length === 42) {
      const code = await ethers.provider.getCode(addr);
      const isDeployed = code !== "0x";
      console.log(`${key.padEnd(25)}: ${addr} | Deployed: ${isDeployed} (${code.length} bytes)`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
