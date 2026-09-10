// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IJobEscrowTarget {
    function applyToJob(string calldata proposalIpfsHash) external;
    function submitWork(string calldata title, string calldata description, string[] calldata evidenceHashes) external;
    function releasePayment() external;
    function claimAutoRelease() external;
    function resolveDispute(uint256 freelancerBps, string calldata reasoningIpfsHash) external;
    function proposeTerms(bytes32 _termsHash) external;
}

/// @title ReentrancyAttacker
/// @notice Test-only contract simulating a malicious freelancer that
///         attempts to re-enter JobEscrow's payout functions from
///         within its own receive() hook, to prove nonReentrant holds.
///         NEVER deploy this outside a test environment.
contract ReentrancyAttacker {
    IJobEscrowTarget public target;
    uint8 public attackMode; // 0 = none, 1 = releasePayment, 2 = claimAutoRelease
    uint256 public reentryAttempts;
    bool public reentryReverted;

    function setTarget(address _target) external {
        target = IJobEscrowTarget(_target);
    }

    function setAttackMode(uint8 mode) external {
        attackMode = mode;
    }

    function triggerApply() external {
        target.applyToJob("ipfs://attacker-proposal");
    }

    function triggerSubmitWork() external {
        string[] memory evidence = new string[](1);
        evidence[0] = "ipfs://attacker-evidence";
        target.submitWork("Attacker Delivery", "Implemented per spec", evidence);
    }

    function triggerRelease() external {
        target.releasePayment();
    }

    function triggerAutoRelease() external {
        target.claimAutoRelease();
    }

    function proposeTerms(bytes32 _termsHash) external {
        target.proposeTerms(_termsHash);
    }

    // This is where the actual attack happens — funds arrive here via
    // low-level call, and we immediately try to call back into the same job before the outer call has finished.
    receive() external payable {
        if (attackMode == 0) return;
        reentryAttempts++;

        if (attackMode == 1) {
            try target.releasePayment() {
                // If this succeeds, the guard failed — test must catch this
            } catch {
                reentryReverted = true;
            }
        } else if (attackMode == 2) {
            try target.claimAutoRelease() {
                // Should never succeed either
            } catch {
                reentryReverted = true;
            }
        }
    }
}
