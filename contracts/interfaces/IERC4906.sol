// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title EIP-4906: Metadata Update Extension
/// @notice See https://eips.ethereum.org/EIPS/eip-4906
/// @dev Interface ID: 0x49064906
interface IERC4906 {
    /// @dev This event emits when the metadata of a token is changed.
    event MetadataUpdate(uint256 _tokenId);

    /// @dev This event emits when the metadata of a range of tokens is changed.
    event BatchMetadataUpdate(uint256 _fromTokenId, uint256 _toTokenId);
}
