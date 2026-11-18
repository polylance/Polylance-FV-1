import { expect } from "chai";
import { ethers } from "hardhat";
import { ReputationSBT_v2 } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("ReputationSBT_v2 (ERC-5192 & EIP-4906 Soulbound Work Certificates)", function () {
  let sbt: ReputationSBT_v2;
  let admin: SignerWithAddress;
  let factory: SignerWithAddress;
  let freelancer: SignerWithAddress;
  let client: SignerWithAddress;
  let stranger: SignerWithAddress;
  let mockJobContract: SignerWithAddress;

  const INITIAL_BASE_URI = "https://polylance.codes/api/metadata/";
  const ERC5192_INTERFACE_ID = "0xb45a3c0e";
  const ERC4906_INTERFACE_ID = "0x49064906";
  const ERC721_INTERFACE_ID = "0x80ac58cd";
  const ERC721_METADATA_INTERFACE_ID = "0x5b5e139f";

  beforeEach(async function () {
    [admin, factory, freelancer, client, stranger, mockJobContract] = await ethers.getSigners();

    const SBTFactory = await ethers.getContractFactory("ReputationSBT_v2");
    sbt = (await SBTFactory.deploy(factory.address, INITIAL_BASE_URI)) as unknown as ReputationSBT_v2;
    await sbt.waitForDeployment();
  });

  describe("ERC-5192 Minimal Soulbound Implementation", function () {
    it("should mint a token to freelancer and emit Locked event", async function () {
      await expect(sbt.connect(factory).mint(freelancer.address, mockJobContract.address))
        .to.emit(sbt, "Locked")
        .withArgs(0);

      expect(await sbt.ownerOf(0)).to.equal(freelancer.address);
      expect(await sbt.balanceOf(freelancer.address)).to.equal(1);
      expect(await sbt.completedJob(0)).to.equal(mockJobContract.address);
    });

    it("should report locked(tokenId) === true for minted tokens", async function () {
      await sbt.connect(factory).mint(freelancer.address, mockJobContract.address);
      expect(await sbt.locked(0)).to.be.true;
    });

    it("should revert locked(tokenId) for nonexistent tokens", async function () {
      await expect(sbt.locked(999)).to.be.revertedWithCustomError(sbt, "ERC721NonexistentToken");
    });

    it("should revert secondary transfers with 'Soulbound: non-transferable'", async function () {
      await sbt.connect(factory).mint(freelancer.address, mockJobContract.address);

      await expect(
        sbt.connect(freelancer).transferFrom(freelancer.address, stranger.address, 0)
      ).to.be.revertedWith("Soulbound: non-transferable");

      await expect(
        sbt.connect(freelancer)["safeTransferFrom(address,address,uint256)"](freelancer.address, stranger.address, 0)
      ).to.be.revertedWith("Soulbound: non-transferable");
    });

    it("should disable approvals to prevent deceptive listings", async function () {
      await sbt.connect(factory).mint(freelancer.address, mockJobContract.address);

      await expect(
        sbt.connect(freelancer).approve(stranger.address, 0)
      ).to.be.revertedWith("Soulbound: approvals disabled");

      await expect(
        sbt.connect(freelancer).setApprovalForAll(stranger.address, true)
      ).to.be.revertedWith("Soulbound: approvals disabled");
    });

    it("should report true for supportsInterface(0xb45a3c0e)", async function () {
      expect(await sbt.supportsInterface(ERC5192_INTERFACE_ID)).to.be.true;
    });
  });

  describe("Metadata & EIP-4906", function () {
    it("should resolve tokenURI with baseURI + tokenId", async function () {
      await sbt.connect(factory).mint(freelancer.address, mockJobContract.address);
      expect(await sbt.tokenURI(0)).to.equal(`${INITIAL_BASE_URI}0`);
    });

    it("should allow admin to update baseURI and emit BatchMetadataUpdate", async function () {
      const NEW_BASE_URI = "ipfs://QmPolyLanceCertificates/";
      await expect(sbt.connect(admin).setBaseURI(NEW_BASE_URI))
        .to.emit(sbt, "BatchMetadataUpdate")
        .withArgs(0, ethers.MaxUint256);

      await sbt.connect(factory).mint(freelancer.address, mockJobContract.address);
      expect(await sbt.tokenURI(0)).to.equal(`${NEW_BASE_URI}0`);
    });

    it("should report true for supportsInterface(0x49064906)", async function () {
      expect(await sbt.supportsInterface(ERC4906_INTERFACE_ID)).to.be.true;
    });

    it("should report true for ERC721 and ERC721Metadata interface IDs", async function () {
      expect(await sbt.supportsInterface(ERC721_INTERFACE_ID)).to.be.true;
      expect(await sbt.supportsInterface(ERC721_METADATA_INTERFACE_ID)).to.be.true;
    });
  });

  describe("Access Control & Anti-Double-Mint Protections", function () {
    it("should revert unauthorized mint calls", async function () {
      await expect(
        sbt.connect(stranger).mint(stranger.address, mockJobContract.address)
      ).to.be.revertedWithCustomError(sbt, "AccessControlUnauthorizedAccount");
    });

    it("should prevent double-minting for the same job and recipient", async function () {
      await sbt.connect(factory).mint(freelancer.address, mockJobContract.address);

      await expect(
        sbt.connect(factory).mint(freelancer.address, mockJobContract.address)
      ).to.be.revertedWith("Already minted for this job");
    });

    it("should allow different recipients for different jobs", async function () {
      const secondJob = client;
      await sbt.connect(factory).mint(freelancer.address, mockJobContract.address);
      await sbt.connect(factory).mint(freelancer.address, secondJob.address);

      expect(await sbt.balanceOf(freelancer.address)).to.equal(2);
    });
  });
});
