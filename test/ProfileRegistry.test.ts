import { expect } from "chai";
import { ethers } from "hardhat";
import { ProfileRegistry } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("ProfileRegistry", function () {
  let profileRegistry: ProfileRegistry;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;

  beforeEach(async function () {
    [user1, user2] = await ethers.getSigners();
    profileRegistry = await ethers.deployContract("ProfileRegistry");
    await profileRegistry.waitForDeployment();
  });

  describe("updateProfile", function () {
    it("should update profile IPFS hash and emit event", async function () {
      const ipfsHash = "QmUser1ProfileHash";
      await expect(profileRegistry.connect(user1).updateProfile(ipfsHash))
        .to.emit(profileRegistry, "ProfileUpdated")
        .withArgs(user1.address, ipfsHash);

      expect(await profileRegistry.profileIpfsHash(user1.address)).to.equal(ipfsHash);
      expect(await profileRegistry.profileIpfsHash(user2.address)).to.equal("");
    });
  });

  describe("addSkill & getSkills", function () {
    it("should add skills and retrieve them", async function () {
      await expect(profileRegistry.connect(user1).addSkill("Solidity"))
        .to.emit(profileRegistry, "SkillAdded")
        .withArgs(user1.address, "Solidity");

      await profileRegistry.connect(user1).addSkill("TypeScript");

      const skills = await profileRegistry.getSkills(user1.address);
      expect(skills).to.deep.equal(["Solidity", "TypeScript"]);
      expect(await profileRegistry.getSkills(user2.address)).to.deep.equal([]);
    });
  });

  describe("removeSkill", function () {
    it("should remove skill by index using swap-and-pop", async function () {
      await profileRegistry.connect(user1).addSkill("Solidity");
      await profileRegistry.connect(user1).addSkill("Rust");
      await profileRegistry.connect(user1).addSkill("Go");

      // Remove index 0 ("Solidity") -> "Go" (last) swaps into index 0
      await expect(profileRegistry.connect(user1).removeSkill(0))
        .to.emit(profileRegistry, "SkillRemoved")
        .withArgs(user1.address, "Solidity");

      const skills = await profileRegistry.getSkills(user1.address);
      expect(skills).to.deep.equal(["Go", "Rust"]);
    });

    it("should revert if index is out of bounds", async function () {
      await profileRegistry.connect(user1).addSkill("Solidity");

      await expect(
        profileRegistry.connect(user1).removeSkill(1)
      ).to.be.revertedWith("Index out of bounds");
    });
  });
});
