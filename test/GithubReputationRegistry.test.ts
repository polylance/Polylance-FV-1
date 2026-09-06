import { expect } from "chai";
import { ethers } from "hardhat";
import { GithubReputationRegistry } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("GithubReputationRegistry", function () {
  let registry: GithubReputationRegistry;
  let oracle: HardhatEthersSigner;
  let user: HardhatEthersSigner;
  let attacker: HardhatEthersSigner;

  const primaryCategory = ethers.encodeBytes32String("blockchain");
  const primaryScore = 800n;
  const secondaryCategories = [ethers.encodeBytes32String("web")];
  const secondaryScores = [400n];

  function buildMessageHash(
    chainId: bigint,
    registryAddress: string,
    userAddr: string,
    primCat: string,
    primScore: bigint,
    secCats: string[],
    secScores: bigint[],
    uid: string
  ): string {
    const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
      ["uint256", "address", "address", "bytes32", "uint256", "bytes32[]", "uint256[]", "bytes32"],
      [chainId, registryAddress, userAddr, primCat, primScore, secCats, secScores, uid]
    );
    return ethers.keccak256(encoded);
  }

  beforeEach(async function () {
    [oracle, user, attacker] = await ethers.getSigners();
    registry = await ethers.deployContract("GithubReputationRegistry");
    await registry.waitForDeployment();
  });

  function makeUID(): string {
    return ethers.keccak256(ethers.toUtf8Bytes(`uid-${Date.now()}-${Math.random()}`));
  }

  async function makeValidAttestation(userAddr: string, uid: string) {
    const chainId = (await ethers.provider.getNetwork()).chainId;
    const msgHash = buildMessageHash(
      chainId,
      await registry.getAddress(),
      userAddr,
      primaryCategory,
      primaryScore,
      secondaryCategories,
      secondaryScores,
      uid
    );
    return await oracle.signMessage(ethers.getBytes(msgHash));
  }

  // ── Valid oracle signature ──────────────────────────────────────────────────

  it("accepts a valid oracle signature and stores the profile", async function () {
    const uid = makeUID();
    const sig = await makeValidAttestation(user.address, uid);

    await expect(
      registry.connect(user).submitSkillVerification(
        primaryCategory,
        primaryScore,
        secondaryCategories,
        secondaryScores,
        uid,
        sig
      )
    )
      .to.emit(registry, "SkillProfileVerified")
      .withArgs(user.address, primaryCategory, primaryScore);

    const profile = await registry.getSkillProfile(user.address);
    expect(profile.primaryCategory).to.equal(primaryCategory);
    expect(profile.primaryScore).to.equal(primaryScore);
    expect(profile.verifiedAt).to.be.gt(0n);
    expect(profile.oracleOperator).to.equal(oracle.address);
  });

  // ── Non-oracle signer rejected ──────────────────────────────────────────────

  it("rejects a signature from a non-oracle address", async function () {
    const uid = makeUID();
    const chainId = (await ethers.provider.getNetwork()).chainId;
    const msgHash = buildMessageHash(
      chainId,
      await registry.getAddress(),
      user.address,
      primaryCategory,
      primaryScore,
      secondaryCategories,
      secondaryScores,
      uid
    );
    // attacker signs instead of oracle
    const sig = await attacker.signMessage(ethers.getBytes(msgHash));

    await expect(
      registry.connect(user).submitSkillVerification(
        primaryCategory,
        primaryScore,
        secondaryCategories,
        secondaryScores,
        uid,
        sig
      )
    ).to.be.revertedWith("Not an authorized oracle");
  });

  // ── Replayed attestationUID rejected ───────────────────────────────────────

  it("rejects a replayed attestationUID", async function () {
    const uid = makeUID();
    const sig = await makeValidAttestation(user.address, uid);

    // First submission succeeds
    await registry.connect(user).submitSkillVerification(
      primaryCategory,
      primaryScore,
      secondaryCategories,
      secondaryScores,
      uid,
      sig
    );

    // Second submission with same UID must revert
    await expect(
      registry.connect(user).submitSkillVerification(
        primaryCategory,
        primaryScore,
        secondaryCategories,
        secondaryScores,
        uid,
        sig
      )
    ).to.be.revertedWith("Already used");
  });

  // ── Mismatched arrays rejected ──────────────────────────────────────────────

  it("rejects mismatched secondary array lengths", async function () {
    const uid = makeUID();
    const sig = await makeValidAttestation(user.address, uid);

    await expect(
      registry.connect(user).submitSkillVerification(
        primaryCategory,
        primaryScore,
        secondaryCategories,
        [], // wrong length
        uid,
        sig
      )
    ).to.be.revertedWith("Mismatched arrays");
  });
});
