// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Votes.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./interfaces/IReputationSBT.sol";
import "./interfaces/IERC5192.sol";
import "./interfaces/IERC4906.sol";

/**
 * @title ReputationSBT_v2
 * @notice Upgraded Soulbound Work Certificate contract compliant with ERC-5192 and EIP-4906.
 * @dev Non-transferable work credentials minted on milestone completion on Polygon.
 */
contract ReputationSBT_v2 is ERC721Votes, AccessControl, IReputationSBT, IERC5192, IERC4906 {
    using Strings for uint256;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE"); // granted to JobFactory

    uint256 private _nextTokenId;
    string private _baseTokenURI;

    /// @notice Maps tokenId → the JobEscrow contract that triggered the mint.
    mapping(uint256 => address) public completedJob;

    /// @notice Prevents double-minting: party => jobContract => hasMinted
    mapping(address => mapping(address => bool)) public hasMintedForJob;

    // ERC-5192 interface ID: bytes4(keccak256("locked(uint256)")) == 0xb45a3c0e
    bytes4 private constant _INTERFACE_ID_ERC5192 = 0xb45a3c0e;
    // EIP-4906 interface ID: 0x49064906
    bytes4 private constant _INTERFACE_ID_ERC4906 = bytes4(0x49064906);

    constructor(address factory, string memory initialBaseURI)
        ERC721("PolyLance Reputation", "PLREP")
        EIP712("PolyLance Reputation", "1")
    {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        if (factory != address(0)) {
            _grantRole(MINTER_ROLE, factory);
        }
        _baseTokenURI = initialBaseURI;
    }

    // ── Minting ──

    /**
     * @notice Mints a soulbound certificate to the recipient upon escrow release.
     * @param to The recipient (freelancer or client)
     * @param jobContract The escrow contract address
     */
    function mint(address to, address jobContract) external onlyRole(MINTER_ROLE) {
        require(to != address(0), "Cannot mint to zero address");
        require(jobContract != address(0), "Zero job contract");
        require(!hasMintedForJob[to][jobContract], "Already minted for this job");

        uint256 tokenId = _nextTokenId++;
        completedJob[tokenId] = jobContract;
        hasMintedForJob[to][jobContract] = true;

        _mint(to, tokenId);
        _delegate(to, to); // self-delegate so voting power activates immediately

        // ERC-5192: Emit Locked event on mint for soulbound tokens
        emit Locked(tokenId);
    }

    // ── ERC-5192 Minimal Soulbound NFTs ──

    /**
     * @notice Returns whether a token is soulbound/locked.
     * @param tokenId The identifier for the NFT.
     * @return True for all existing tokens. Reverts if token does not exist.
     */
    function locked(uint256 tokenId) external view override returns (bool) {
        _requireOwned(tokenId);
        return true;
    }

    // ── Metadata & EIP-4906 ──

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function baseURI() external view returns (string memory) {
        return _baseTokenURI;
    }

    function setBaseURI(string calldata newBaseURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _baseTokenURI = newBaseURI;
        emit BatchMetadataUpdate(0, type(uint256).max);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        string memory base = _baseURI();
        return bytes(base).length > 0 ? string.concat(base, tokenId.toString()) : "";
    }

    function refreshMetadata(uint256 tokenId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _requireOwned(tokenId);
        emit MetadataUpdate(tokenId);
    }

    // ── Soulbound Transfer Restrictions ──

    /**
     * @dev Blocks all secondary transfers. Only minting (from == 0) and burning (to == 0) allowed.
     */
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        require(
            to == address(0) || _ownerOf(tokenId) == address(0),
            "Soulbound: non-transferable"
        );
        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Approvals are disabled for soulbound tokens to prevent deceptive approvals.
     */
    function approve(address, uint256) public pure override {
        revert("Soulbound: approvals disabled");
    }

    function setApprovalForAll(address, bool) public pure override {
        revert("Soulbound: approvals disabled");
    }

    // ── Interface Support ──

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return
            interfaceId == _INTERFACE_ID_ERC5192 ||
            interfaceId == _INTERFACE_ID_ERC4906 ||
            super.supportsInterface(interfaceId);
    }
}
