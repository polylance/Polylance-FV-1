// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Votes.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "./interfaces/IReputationSBT.sol";

contract ReputationSBT is ERC721Votes, AccessControl, IReputationSBT {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE"); // granted to JobFactory

    uint256 private _nextTokenId;

    /// @notice Maps tokenId → the JobEscrow contract that triggered the mint.
    mapping(uint256 => address) public completedJob;

    constructor(address factory)
        ERC721("PolyLance Reputation", "PLREP")
        EIP712("PolyLance Reputation", "1")
    {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, factory);
    }

    function mint(address to, address jobContract) external onlyRole(MINTER_ROLE) {
        uint256 tokenId = _nextTokenId++;
        completedJob[tokenId] = jobContract;
        _mint(to, tokenId);
        _delegate(to, to); // self-delegate so voting power activates immediately
    }

    /// @dev Soulbound: block all transfers except minting (from == address(0)).
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        require(
            to == address(0) || _ownerOf(tokenId) == address(0),
            "Soulbound: non-transferable"
        );
        return super._update(to, tokenId, auth);
    }

    // Required override: ERC721Votes + AccessControl both define supportsInterface
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
