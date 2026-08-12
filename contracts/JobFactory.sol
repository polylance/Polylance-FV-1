// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IReputationSBT.sol";
import "./JobEscrow.sol";

contract JobFactory is AccessControl {
    bytes32 public constant ARBITRATOR_ROLE = keccak256("ARBITRATOR_ROLE");
    bytes32 public constant TREASURY_ADMIN_ROLE = keccak256("TREASURY_ADMIN_ROLE");

    address public immutable jobImplementation;
    IReputationSBT public immutable reputationSBT;
    address[] public allJobs;
    mapping(address => bool) public isJob;
    uint256 public treasuryBalance;
    uint256 public constant DEFAULT_REVIEW_PERIOD = 7 days;

    event JobDeployed(address indexed jobContract, address indexed client);
    event FeeCollected(address indexed job, uint256 amount);
    event TreasuryWithdrawal(address indexed to, uint256 amount, address indexed by);

    constructor(address _jobImplementation, address _reputationSBT) {
        jobImplementation = _jobImplementation;
        reputationSBT = IReputationSBT(_reputationSBT);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function postJob(string calldata descriptionIpfsHash) external returns (address jobContract) {
        jobContract = Clones.clone(jobImplementation);
        isJob[jobContract] = true;
        allJobs.push(jobContract);
        JobEscrow(jobContract).initialize(msg.sender, descriptionIpfsHash, DEFAULT_REVIEW_PERIOD);
        emit JobDeployed(jobContract, msg.sender);
    }

    function getAllJobs() external view returns (address[] memory) {
        return allJobs;
    }

    /// @notice Only callable by clone contracts created by this factory.
    function collectFee() external payable {
        require(isJob[msg.sender], "Only registered job contracts");
        treasuryBalance += msg.value;
        emit FeeCollected(msg.sender, msg.value);
    }

    function mintReputationSBT(address to, address jobContract) external {
        require(isJob[msg.sender], "Only registered job contracts");
        reputationSBT.mint(to, jobContract);
    }

    function withdrawTreasury(address to, uint256 amount) external onlyRole(TREASURY_ADMIN_ROLE) {
        require(amount <= treasuryBalance, "Insufficient treasury balance");
        treasuryBalance -= amount;
        payable(to).transfer(amount);
        emit TreasuryWithdrawal(to, amount, msg.sender);
    }
}
