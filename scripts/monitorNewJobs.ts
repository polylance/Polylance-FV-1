import { ethers } from "hardhat";
import { registerJobForMonitoring } from "../lib/auditx/client";
import { invalidateCache } from "../lib/indexing/aggregate";
import * as fs from "fs";
import * as path from "path";

export async function logMonitoringGap(jobContract: string) {
  console.warn(`[MONITORING GAP LOGGED] Job contract ${jobContract} failed to register with AuditX.`);
  const logFile = path.join(__dirname, "..", "monitoring_gaps.log");
  const entry = `[${new Date().toISOString()}] Monitoring registration gap for ${jobContract}\n`;
  fs.appendFileSync(logFile, entry);
}

export async function listenAndMonitorJobs(factoryAddress: string) {
  const factory = await ethers.getContractAt("JobFactory", factoryAddress);
  console.log(`Listening for JobDeployed events on JobFactory at ${factoryAddress}...`);

  factory.on("JobDeployed", async (jobContract: string, client: string) => {
    console.log(`JobDeployed detected: ${jobContract} (client: ${client})`);
    
    // Invalidate platform-wide analytics cache so the new job is included immediately
    invalidateCache();

    const registered = await registerJobForMonitoring(jobContract);
    if (!registered) {
      // Job still posts successfully — monitoring is additive, not a
      // hard dependency of the core product. Track failures for
      // follow-up, don't silently drop them either.
      await logMonitoringGap(jobContract);
    } else {
      console.log(`Successfully registered job ${jobContract} with AuditX monitoring.`);
    }
  });
}

async function main() {
  const manifestPath = path.join(__dirname, "..", "amoy_deployment_addresses.json");
  if (!fs.existsSync(manifestPath)) {
    console.log("No amoy_deployment_addresses.json found. Standing by for factory address parameter.");
    return;
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (manifest.contracts && manifest.contracts.JobFactory) {
    await listenAndMonitorJobs(manifest.contracts.JobFactory);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
