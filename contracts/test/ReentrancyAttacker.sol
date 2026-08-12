// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IJobEscrow {
    function claimAutoRelease() external;
    function releasePayment() external;
    function submitWork(string calldata title, string calldata description, string[] calldata evidenceHashes) external;
    function proposeTerms(bytes32 _termsHash) external;
    function applyToJob(string calldata proposalIpfsHash) external;
}

contract ReentrancyAttacker {
    address public target;
    uint256 public callCount;
    bool public shouldReenter;

    constructor(address _target) {
        target = _target;
    }

    function setShouldReenter(bool _shouldReenter) external {
        shouldReenter = _shouldReenter;
    }

    function attackAutoRelease() external {
        IJobEscrow(target).claimAutoRelease();
    }

    function submitWork(string calldata title, string calldata description, string[] calldata evidenceHashes) external {
        IJobEscrow(target).submitWork(title, description, evidenceHashes);
    }

    function proposeTerms(bytes32 _termsHash) external {
        IJobEscrow(target).proposeTerms(_termsHash);
    }

    function applyToJob(string calldata _proposalHash) external {
        IJobEscrow(target).applyToJob(_proposalHash);
    }

    receive() external payable {
        if (shouldReenter && callCount < 2) {
            callCount++;
            IJobEscrow(target).claimAutoRelease();
        }
    }
}
