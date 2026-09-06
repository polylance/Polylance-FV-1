// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockUSDT
/// @notice Test-only ERC20 contract simulating Tether USD (USDT) with 6 decimals.
///         NEVER deploy this contract to a production mainnet.
contract MockUSDT is ERC20 {
    constructor() ERC20("Mock Tether USD", "USDT") {
        _mint(msg.sender, 1_000_000 * 10**6);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function faucet(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
