// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IJobFactory {
    function ARBITRATOR_ROLE() external view returns (bytes32);
    function hasRole(bytes32 role, address account) external view returns (bool);
    function collectFee() external payable;
    function mintReputationSBT(address to, address jobContract) external;
}
