import { expect } from "chai";
import { ethers } from "hardhat";
import { JobEscrow, JobFactory, ReputationSBT, ReentrancyAttacker } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("ReentrancyGuard", function () {
  let factory: JobFactory;
  let sbt: ReputationSBT;
  let implementation: JobEscrow;
  let admin: HardhatEthersSigner;
  let client: HardhatEthersSigner;
  let attackerWallet: HardhatEthersSigner;
  let attackerContract: ReentrancyAttacker;
  let escrowContract: JobEscrow;

  beforeEach(async function () {
    [admin, client, attackerWallet] = await ethers.getSigners();

    // 1. Deploy contracts
    implementation = await ethers.deployContract("JobEscrow");
    await implementation.waitForDeployment();

    sbt = await ethers.deployContract("ReputationSBT", [ethers.ZeroAddress]);
    await sbt.waitForDeployment();

    factory = await ethers.deployContract("JobFactory", [
      await implementation.getAddress(),
      await sbt.getAddress(),
    ]);
    await factory.waitForDeployment();

    const MINTER_ROLE = await sbt.MINTER_ROLE();
    await sbt.grantRole(MINTER_ROLE, await factory.getAddress());

    // 2. Client creates Job Escrow via Factory
    const tx = await factory.connect(client).postJob("QmJobDescriptionHash");
    const receipt = await tx.wait();
    
    // Find clone address from JobDeployed event
    const event = receipt?.logs
      .map((log: any) => {
        try {
          return factory.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((e) => e && e.name === "JobDeployed");

    const cloneAddr = event?.args?.[0];
    escrowContract = await ethers.getContractAt("JobEscrow", cloneAddr) as unknown as JobEscrow;

    // 3. Deploy Reentrancy Attacker contract, passing clone address
    attackerContract = await ethers.deployContract("ReentrancyAttacker", [cloneAddr]) as unknown as ReentrancyAttacker;
    await attackerContract.waitForDeployment();

    // 4. Attacker contract applies to job
    await attackerContract.connect(attackerWallet).applyToJob("QmProposalHash");
    
    // Client selects attacker contract address
    await escrowContract.connect(client).selectFreelancer(await attackerContract.getAddress());

    // 5. Agree on terms
    const termsHash = ethers.keccak256(ethers.toUtf8Bytes("Terms v1"));
    await escrowContract.connect(client).proposeTerms(termsHash);
    await attackerContract.connect(attackerWallet).proposeTerms(termsHash);

    // 6. Fund the job
    await escrowContract.connect(client).fundJob({ value: ethers.parseEther("1.0") });
  });

  it("should prevent reentrancy during claimAutoRelease", async function () {
    // 1. Submit work via attacker contract
    await attackerContract.connect(attackerWallet).submitWork("Verdict", "Explanation", ["hash1"]);

    // 2. Increase block time to pass the review period (default 7 days)
    await ethers.provider.send("evm_increaseTime", [7 * 24 * 3600 + 10]);
    await ethers.provider.send("evm_mine", []);

    // 3. Enable reentrancy in attacker contract
    await attackerContract.connect(attackerWallet).setShouldReenter(true);

    // 4. Try to attack. The reentrant call should revert.
    await expect(
      attackerContract.connect(attackerWallet).attackAutoRelease()
    ).to.be.reverted;

    // Verify contract remains in Submitted state and balance is intact
    expect(await escrowContract.status()).to.equal(2); // 2 = Submitted
  });
});
