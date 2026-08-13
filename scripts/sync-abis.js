const fs = require('fs');
const path = require('path');

const artifactsDir = path.join(__dirname, '../artifacts/contracts');
const abisOutputDir = path.join(__dirname, '../frontend/src/config/abis');

// Ensure output dir exists
if (!fs.existsSync(abisOutputDir)) {
  fs.mkdirSync(abisOutputDir, { recursive: true });
}

// List of contracts to sync
const contracts = [
  'JobEscrow',
  'JobFactory',
  'ProfileRegistry',
  'ReputationSBT',
  'GithubReputationRegistry',
  'JudgeDAO'
];

contracts.forEach(contractName => {
  // Hardhat artifacts structure: contractName.sol/contractName.json
  const artifactPath = path.join(artifactsDir, `${contractName}.sol`, `${contractName}.json`);
  if (!fs.existsSync(artifactPath)) {
    console.error(`Artifact not found for ${contractName} at ${artifactPath}`);
    return;
  }
  
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const abi = artifact.abi;
  
  const outputPath = path.join(abisOutputDir, `${contractName}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(abi, null, 2));
  console.log(`Synced ABI for ${contractName} -> ${outputPath}`);
});
