// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ProfileRegistry {
    mapping(address => string) public profileIpfsHash;   // bio, avatar, etc.
    mapping(address => string[]) public skills;

    event ProfileUpdated(address indexed user, string ipfsHash);
    event SkillAdded(address indexed user, string skill);
    event SkillRemoved(address indexed user, string skill);

    function updateProfile(string calldata ipfsHash) external {
        profileIpfsHash[msg.sender] = ipfsHash;
        emit ProfileUpdated(msg.sender, ipfsHash);
    }

    function addSkill(string calldata skill) external {
        skills[msg.sender].push(skill);
        emit SkillAdded(msg.sender, skill);
    }

    /// @notice Remove a skill by index. Swaps with last element to avoid gaps.
    function removeSkill(uint256 index) external {
        string[] storage userSkills = skills[msg.sender];
        require(index < userSkills.length, "Index out of bounds");
        string memory removed = userSkills[index];
        // Swap with last and pop
        userSkills[index] = userSkills[userSkills.length - 1];
        userSkills.pop();
        emit SkillRemoved(msg.sender, removed);
    }

    function getSkills(address user) external view returns (string[] memory) {
        return skills[user];
    }
}
