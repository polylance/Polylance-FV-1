// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";

contract JudgeDAO is Governor, GovernorSettings, GovernorCountingSimple, GovernorVotes {
    constructor(IVotes _reputationSBT)
        Governor("PolyLance Judge DAO")
        GovernorSettings(
            1 days,   // votingDelay
            7 days,   // votingPeriod
            1         // proposalThreshold (must hold ≥1 SBT voting unit)
        )
        GovernorVotes(_reputationSBT)
    {}

    /// @dev Quorum is 1 for MVP — tune post-launch.
    function quorum(uint256 /* blockNumber */) public pure override returns (uint256) {
        return 1;
    }

    // ── Required overrides: delegate to GovernorSettings ──

    function votingDelay()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }
}
