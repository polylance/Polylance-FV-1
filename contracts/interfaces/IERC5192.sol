// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ERC-5192 Minimal Soulbound NFTs
/// @notice See https://eips.ethereum.org/EIPS/eip-5192
/// @dev Interface ID: bytes4(keccak256("locked(uint256)")) == 0xb45a3c0e
interface IERC5192 {
    /// @notice Emitted when the locking status of a token is initialized to locked
    event Locked(uint256 tokenId);

    /// @notice Emitted when the locking status of a token is initialized to unlocked
    event Unlocked(uint256 tokenId);

    /// @notice Returns the locking status of an NFT
    /// @param tokenId The identifier for an NFT
    /// @return "true" if the NFT is locked/soulbound, "false" if it can be transferred
    function locked(uint256 tokenId) external view returns (bool);
}
