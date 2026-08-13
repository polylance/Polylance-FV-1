// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract GithubReputationRegistry is AccessControl {
    using ECDSA for bytes32;

    bytes32 public constant ORACLE_OPERATOR_ROLE = keccak256("ORACLE_OPERATOR_ROLE");

    struct SkillProfile {
        bytes32 primaryCategory;
        uint256 primaryScore;
        bytes32[] secondaryCategories;
        uint256[] secondaryScores;
        uint256 verifiedAt;
        address oracleOperator;
    }

    mapping(address => SkillProfile) public skillProfiles;
    mapping(bytes32 => bool) public usedAttestations;

    event SkillProfileVerified(address indexed user, bytes32 primaryCategory, uint256 primaryScore);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_OPERATOR_ROLE, msg.sender);
    }

    function submitSkillVerification(
        bytes32 primaryCategory,
        uint256 primaryScore,
        bytes32[] calldata secondaryCategories,
        uint256[] calldata secondaryScores,
        bytes32 attestationUID,
        bytes calldata oracleSignature
    ) external {
        require(secondaryCategories.length == secondaryScores.length, "Mismatched arrays");
        require(!usedAttestations[attestationUID], "Already used");

        bytes32 messageHash = keccak256(abi.encode(
            msg.sender,
            primaryCategory,
            primaryScore,
            secondaryCategories,
            secondaryScores,
            attestationUID
        ));
        address signer = MessageHashUtils.toEthSignedMessageHash(messageHash).recover(oracleSignature);
        require(hasRole(ORACLE_OPERATOR_ROLE, signer), "Not an authorized oracle");

        usedAttestations[attestationUID] = true;
        skillProfiles[msg.sender] = SkillProfile(
            primaryCategory,
            primaryScore,
            secondaryCategories,
            secondaryScores,
            block.timestamp,
            signer
        );
        emit SkillProfileVerified(msg.sender, primaryCategory, primaryScore);
    }

    function getSkillProfile(address user) external view returns (SkillProfile memory) {
        return skillProfiles[user];
    }
}
