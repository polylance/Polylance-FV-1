// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./interfaces/IJobFactory.sol";

contract JobEscrow is Initializable {
    enum JobStatus { Open, Selected, Submitted, Disputed, Completed, Cancelled }
    enum DisputeReason { QUALITY, NON_DELIVERY, SCOPE_DISAGREEMENT, PAYMENT_DISPUTE, OTHER }

    struct Application {
        address applicant;
        string  proposalIpfsHash;
        uint256 appliedAt;
    }

    struct ProofOfWork {
        string   title;
        string   description;
        string[] evidenceHashes;
        uint256  submittedAt;
    }

    struct Dispute {
        address raisedBy;
        DisputeReason reason;
        string evidenceIpfsHash;
        uint256 raisedAt;
        bool resolved;
    }

    address public factory;
    address public client;
    address public freelancer;
    uint256 public amount;
    JobStatus public status;
    string  public descriptionIpfsHash;
    bytes32 public termsHash;
    uint256 public submittedAt;
    uint256 public reviewPeriod;
    uint256 public constant PLATFORM_FEE_BPS = 250; // 2.5%

    Application[] public applications;
    mapping(address => bool) public hasApplied;
    mapping(address => bool) public acceptedTermsBy;
    mapping(address => bool) public cancelConsent;
    ProofOfWork public proof;
    Dispute public dispute;
    string public disputeResponseIpfsHash;

    event JobPosted(address client, string descriptionIpfsHash);
    event ApplicationSubmitted(address applicant);
    event FreelancerSelected(address freelancer);
    event SelectionDeclined();
    event TermsProposed(address by, bytes32 termsHash);
    event JobFunded(uint256 amount);
    event WorkSubmitted(string title, uint256 evidenceCount);
    event PaymentReleased(uint256 toFreelancer, uint256 fee);
    event AutoReleased();
    event JobCancelled(uint256 refund);
    event CancelConsentGiven(address by);
    event DisputeRaised(address by, DisputeReason reason, string evidenceIpfsHash);
    event DisputeResponseSubmitted(address by, string responseIpfsHash);
    event DisputeResolved(uint256 freelancerBps, address judge, string reasoningIpfsHash);

    modifier onlyParty() {
        require(msg.sender == client || msg.sender == freelancer, "Not a party to this job");
        _;
    }

    function initialize(address _client, string calldata _descriptionIpfsHash, uint256 _reviewPeriod) external initializer {
        require(_client != address(0), "Invalid client address");
        factory = msg.sender;
        client = _client;
        descriptionIpfsHash = _descriptionIpfsHash;
        reviewPeriod = _reviewPeriod;
        status = JobStatus.Open;
        emit JobPosted(_client, _descriptionIpfsHash);
    }

    // ── Funding — can happen anytime while Open or Selected, freelancer not required yet ──
    function fundJob() external payable {
        require(msg.sender == client, "Only client funds");
        require(status == JobStatus.Open || status == JobStatus.Selected, "Wrong status");
        amount += msg.value;
        emit JobFunded(msg.value);
    }

    // ── Applications ──
    function applyToJob(string calldata proposalIpfsHash) external {
        require(status == JobStatus.Open, "Job not open");
        require(!hasApplied[msg.sender], "Already applied");
        require(msg.sender != client, "Client cannot apply to own job");

        applications.push(Application(msg.sender, proposalIpfsHash, block.timestamp));
        hasApplied[msg.sender] = true;
        emit ApplicationSubmitted(msg.sender);
    }

    function getApplicants() external view returns (Application[] memory) {
        return applications;
    }

    function selectFreelancer(address _freelancer) external {
        require(msg.sender == client, "Only client selects");
        require(status == JobStatus.Open, "Not open");
        require(hasApplied[_freelancer], "Did not apply");

        freelancer = _freelancer;
        status = JobStatus.Selected;
        emit FreelancerSelected(_freelancer);
    }

    function declineSelection() external {
        require(msg.sender == freelancer, "Only selected freelancer");
        require(status == JobStatus.Selected, "Wrong status");
        require(termsHash == bytes32(0), "Terms already finalized");

        freelancer = address(0);
        status = JobStatus.Open;
        emit SelectionDeclined();
    }

    // ── Terms & cancellation ──
    function proposeTerms(bytes32 _termsHash) external onlyParty {
        require(status == JobStatus.Selected, "Wrong status");
        acceptedTermsBy[msg.sender] = true;
        if (acceptedTermsBy[client] && acceptedTermsBy[freelancer]) {
            termsHash = _termsHash;
        }
        emit TermsProposed(msg.sender, _termsHash);
    }

    function cancelJob() external {
        require(msg.sender == client, "Only client cancels");
        require(status == JobStatus.Open, "Too late to cancel unilaterally");
        _refund();
    }

    function proposeMutualCancel() external onlyParty {
        require(status == JobStatus.Selected, "Wrong status");
        cancelConsent[msg.sender] = true;
        emit CancelConsentGiven(msg.sender);
        if (cancelConsent[client] && cancelConsent[freelancer]) {
            _refund();
        }
    }

    function _refund() internal {
        status = JobStatus.Cancelled;
        uint256 refund = amount;
        amount = 0;
        if (refund > 0) payable(client).transfer(refund);
        emit JobCancelled(refund);
    }

    // ── Work submission & review ──
    function submitWork(string calldata title, string calldata description, string[] calldata evidenceHashes) external {
        require(msg.sender == freelancer, "Only assigned freelancer");
        require(status == JobStatus.Selected, "Wrong status");
        require(evidenceHashes.length > 0, "Must attach evidence");

        proof = ProofOfWork(title, description, evidenceHashes, block.timestamp);
        status = JobStatus.Submitted;
        submittedAt = block.timestamp;
        emit WorkSubmitted(title, evidenceHashes.length);
    }

    function releasePayment() external {
        require(msg.sender == client, "Only client releases");
        require(status == JobStatus.Submitted, "Not submitted");
        _completeJob(10000); // 100% to freelancer
    }

    function claimAutoRelease() external {
        require(status == JobStatus.Submitted, "Not awaiting review");
        require(block.timestamp >= submittedAt + reviewPeriod, "Review period still active");
        _completeJob(10000);
        emit AutoReleased();
    }

    // ── Disputes ──
    function raiseDispute(DisputeReason reason, string calldata evidenceIpfsHash) external onlyParty {
        require(status == JobStatus.Submitted || status == JobStatus.Selected, "Nothing to dispute");
        require(dispute.raisedAt == 0, "Already disputed");

        dispute = Dispute(msg.sender, reason, evidenceIpfsHash, block.timestamp, false);
        status = JobStatus.Disputed;
        emit DisputeRaised(msg.sender, reason, evidenceIpfsHash);
    }

    function submitDisputeResponse(string calldata responseIpfsHash) external onlyParty {
        require(msg.sender != dispute.raisedBy, "This is the response, not the original");
        require(status == JobStatus.Disputed, "No active dispute");
        disputeResponseIpfsHash = responseIpfsHash;
        emit DisputeResponseSubmitted(msg.sender, responseIpfsHash);
    }

    function resolveDispute(uint256 freelancerBps, string calldata reasoningIpfsHash) external {
        require(
            IJobFactory(factory).hasRole(IJobFactory(factory).ARBITRATOR_ROLE(), msg.sender),
            "Not an arbitrator"
        );
        require(status == JobStatus.Disputed, "No active dispute");
        require(freelancerBps <= 10000, "Invalid split");

        dispute.resolved = true;
        _completeJob(freelancerBps);
        emit DisputeResolved(freelancerBps, msg.sender, reasoningIpfsHash);
    }

    function _completeJob(uint256 freelancerBps) internal {
        status = JobStatus.Completed;
        uint256 fee = (amount * PLATFORM_FEE_BPS) / 10000;
        uint256 distributable = amount - fee;
        uint256 toFreelancer = (distributable * freelancerBps) / 10000;
        uint256 toClient = distributable - toFreelancer;

        if (fee > 0) IJobFactory(factory).collectFee{value: fee}();
        if (toFreelancer > 0) payable(freelancer).transfer(toFreelancer);
        if (toClient > 0) payable(client).transfer(toClient);

        if (freelancerBps > 0) {
            IJobFactory(factory).mintReputationSBT(freelancer, address(this));
        }
        emit PaymentReleased(toFreelancer, fee);
    }
}
