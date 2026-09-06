// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IReputationSBT.sol";
import "./JobEscrow.sol";

contract JobFactory is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant ARBITRATOR_ROLE = keccak256("ARBITRATOR_ROLE");
    bytes32 public constant TREASURY_ADMIN_ROLE = keccak256("TREASURY_ADMIN_ROLE");

    address public immutable jobImplementation;
    IReputationSBT public immutable reputationSBT;
    address[] public allJobs;
    mapping(address => bool) public isJob;
    mapping(address => bool) public approvedPaymentTokens; // address(0) = native MATIC, implicitly approved
    mapping(address => uint256) public treasuryBalanceByToken;
    uint256 public constant DEFAULT_REVIEW_PERIOD = 7 days;

    event JobDeployed(address indexed jobContract, address indexed client, address paymentToken);
    event PaymentTokenApproved(address indexed token, bool approved);
    event FeeCollected(address indexed job, address indexed token, uint256 amount);
    event TreasuryWithdrawal(address indexed to, address indexed token, uint256 amount, address indexed by);

    constructor(address _jobImplementation, address _reputationSBT) {
        require(_jobImplementation != address(0), "Zero implementation address");
        require(_reputationSBT != address(0), "Zero SBT address");
        jobImplementation = _jobImplementation;
        reputationSBT = IReputationSBT(_reputationSBT);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function setApprovedPaymentToken(address token, bool approved) external onlyRole(DEFAULT_ADMIN_ROLE) {
        approvedPaymentTokens[token] = approved;
        emit PaymentTokenApproved(token, approved);
    }

    function postJob(string calldata descriptionIpfsHash, address paymentToken) external returns (address jobContract) {
        require(paymentToken == address(0) || approvedPaymentTokens[paymentToken], "Payment token not approved");
        jobContract = Clones.clone(jobImplementation);
        isJob[jobContract] = true;
        allJobs.push(jobContract);
        emit JobDeployed(jobContract, msg.sender, paymentToken);
        JobEscrow(jobContract).initialize(msg.sender, descriptionIpfsHash, DEFAULT_REVIEW_PERIOD, paymentToken);
    }

    function getAllJobs() external view returns (address[] memory) {
        return allJobs;
    }

    function isJobContract(address job) external view returns (bool) {
        return isJob[job];
    }

    function treasuryBalance() external view returns (uint256) {
        return treasuryBalanceByToken[address(0)];
    }

    /// @notice Only callable by clone contracts created by this factory.
    function collectFee() external payable {
        collectFee(address(0), msg.value);
    }

    function collectFee(address token, uint256 feeAmount) public payable {
        require(isJob[msg.sender], "Only registered job contracts");
        if (token == address(0)) {
            treasuryBalanceByToken[address(0)] += msg.value;
            emit FeeCollected(msg.sender, address(0), msg.value);
        } else {
            treasuryBalanceByToken[token] += feeAmount;
            emit FeeCollected(msg.sender, token, feeAmount);
        }
    }

    function mintReputationSBT(address to, address jobContract) external {
        require(isJob[msg.sender], "Only registered job contracts");
        require(jobContract == msg.sender, "Job contract must mint for itself");
        reputationSBT.mint(to, jobContract);
    }

    // slither-disable-next-line arbitrary-send-eth
    function withdrawTreasury(address token, address to, uint256 amount) external onlyRole(TREASURY_ADMIN_ROLE) nonReentrant {
        require(to != address(0), "Invalid address");
        require(amount <= treasuryBalanceByToken[token], "Insufficient treasury balance");
        treasuryBalanceByToken[token] -= amount;
        if (token == address(0)) {
            (bool ok, ) = payable(to).call{value: amount}("");
            require(ok, "Transfer failed");
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
        emit TreasuryWithdrawal(to, token, amount, msg.sender);
    }
}
