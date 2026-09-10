// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IJobFactory.sol";

contract JobEscrow is Initializable, ReentrancyGuard {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    using SafeERC20 for IERC20;

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

    struct TimeExtensionRequest {
        uint256 requestedDays;
        string reasonIpfsHash;
        uint256 requestedAt;
        bool responded;
        bool approved;
    }

    address public factory;
    address public client;
    address public freelancer;
    address public paymentToken; // address(0) = native MATIC, otherwise ERC20 token address
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
    TimeExtensionRequest[] public extensionRequests;
    string[] public progressUpdateHashes; // append-only log of progress updates

    event JobPosted(address indexed client, string descriptionIpfsHash, address indexed paymentToken);
    event ApplicationSubmitted(address indexed applicant);
    event FreelancerSelected(address indexed freelancer);
    event SelectionDeclined();
    event TermsProposed(address indexed by, bytes32 termsHash);
    event JobFunded(uint256 amount);
    event WorkSubmitted(string title, uint256 evidenceCount);
    event PaymentReleased(uint256 toFreelancer, uint256 fee);
    event AutoReleased();
    event JobCancelled(uint256 refund);
    event CancelConsentGiven(address indexed by);
    event DisputeRaised(address indexed by, DisputeReason reason, string evidenceIpfsHash);
    event DisputeResponseSubmitted(address indexed by, string responseIpfsHash);
    event DisputeResolved(uint256 freelancerBps, address indexed judge, string reasoningIpfsHash);
    event ProgressUpdatePosted(uint256 indexed jobId, string updateIpfsHash, uint256 timestamp);
    event TimeExtensionRequested(uint256 indexed requestIndex, uint256 requestedDays, string reasonIpfsHash);
    event TimeExtensionResponded(uint256 indexed requestIndex, bool approved);
    event ModificationRequested(string noteIpfsHash, uint256 timestamp);

    modifier onlyParty() {
        require(msg.sender == client || msg.sender == freelancer, "Not a party to this job");
        _;
    }

    function initialize(
        address _client,
        string calldata _descriptionIpfsHash,
        uint256 _reviewPeriod
    ) external initializer {
        initialize(_client, _descriptionIpfsHash, _reviewPeriod, address(0));
    }

    function initialize(
        address _client,
        string calldata _descriptionIpfsHash,
        uint256 _reviewPeriod,
        address _paymentToken
    ) public initializer {
        require(_client != address(0), "Invalid client address");
        factory = msg.sender;
        client = _client;
        descriptionIpfsHash = _descriptionIpfsHash;
        reviewPeriod = _reviewPeriod;
        paymentToken = _paymentToken;
        status = JobStatus.Open;
        emit JobPosted(_client, _descriptionIpfsHash, _paymentToken);
    }

    // ── Funding — native MATIC or ERC-20 token ──
    function fundJob(uint256 tokenAmount) external payable nonReentrant {
        require(msg.sender == client, "Only client funds");
        require(status == JobStatus.Open || status == JobStatus.Selected, "Wrong status");

        if (paymentToken == address(0)) {
            require(msg.value > 0, "Must send MATIC");
            require(tokenAmount == 0, "Do not pass tokenAmount for native jobs");
            amount += msg.value;
            emit JobFunded(msg.value);
        } else {
            require(msg.value == 0, "Do not send MATIC for token jobs");
            require(tokenAmount > 0, "Must specify token amount");
            IERC20(paymentToken).safeTransferFrom(msg.sender, address(this), tokenAmount);
            amount += tokenAmount;
            emit JobFunded(tokenAmount);
        }
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
            require(termsHash == bytes32(0) || termsHash == _termsHash, "Terms hash mismatch: both parties must agree on the same terms");
            termsHash = _termsHash;
        }
        emit TermsProposed(msg.sender, _termsHash);
    }

    function cancelJob() external nonReentrant {
        require(msg.sender == client, "Only client cancels");
        require(status == JobStatus.Open, "Too late to cancel unilaterally");
        _refund();
    }

    function proposeMutualCancel() external onlyParty nonReentrant {
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
        if (refund > 0) _safeTransfer(client, refund);
        emit JobCancelled(refund);
    }

    // ── Extended Workflow & Progress Tracking ──
    function postProgressUpdate(string calldata updateIpfsHash) external {
        require(msg.sender == freelancer, "Only freelancer posts progress");
        require(status == JobStatus.Selected, "Job not in progress");
        progressUpdateHashes.push(updateIpfsHash);
        emit ProgressUpdatePosted(0, updateIpfsHash, block.timestamp);
    }

    function requestTimeExtension(uint256 requestedDays, string calldata reasonIpfsHash) external {
        require(msg.sender == freelancer, "Only freelancer requests extension");
        require(status == JobStatus.Selected, "Job not in progress");
        require(requestedDays > 0 && requestedDays <= 90, "Unreasonable extension request");

        extensionRequests.push(TimeExtensionRequest({
            requestedDays: requestedDays,
            reasonIpfsHash: reasonIpfsHash,
            requestedAt: block.timestamp,
            responded: false,
            approved: false
        }));
        emit TimeExtensionRequested(extensionRequests.length - 1, requestedDays, reasonIpfsHash);
    }

    function respondToTimeExtension(uint256 requestIndex, bool approve) external {
        require(msg.sender == client, "Only client responds");
        require(requestIndex < extensionRequests.length, "Invalid request");
        TimeExtensionRequest storage req = extensionRequests[requestIndex];
        require(!req.responded, "Already responded");

        req.responded = true;
        req.approved = approve;
        if (approve) {
            reviewPeriod += req.requestedDays * 1 days;
        }
        emit TimeExtensionResponded(requestIndex, approve);
    }

    function requestModifications(string calldata noteIpfsHash) external {
        require(msg.sender == client, "Only client requests modifications");
        require(status == JobStatus.Submitted, "Nothing to modify yet");
        status = JobStatus.Selected;
        emit ModificationRequested(noteIpfsHash, block.timestamp);
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

    function releasePayment() external nonReentrant {
        require(msg.sender == client, "Only client releases");
        require(status == JobStatus.Submitted, "Not submitted");
        _completeJob(10000); // 100% to freelancer
    }

    function claimAutoRelease() external nonReentrant {
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
        require(bytes(disputeResponseIpfsHash).length == 0, "Response already submitted");
        disputeResponseIpfsHash = responseIpfsHash;
        emit DisputeResponseSubmitted(msg.sender, responseIpfsHash);
    }

    function resolveDispute(uint256 freelancerBps, string calldata reasoningIpfsHash) external nonReentrant {
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
        uint256 totalAmount = amount;
        amount = 0;
        uint256 fee = (totalAmount * PLATFORM_FEE_BPS) / 10000;
        uint256 distributable = totalAmount - fee;
        uint256 toFreelancer = (distributable * freelancerBps) / 10000;
        uint256 toClient = distributable - toFreelancer;

        if (fee > 0) {
            if (paymentToken == address(0)) {
                IJobFactory(factory).collectFee{value: fee}(address(0), fee);
            } else {
                IERC20(paymentToken).safeTransfer(factory, fee);
                IJobFactory(factory).collectFee(paymentToken, fee);
            }
        }
        if (toFreelancer > 0) _safeTransfer(freelancer, toFreelancer);
        if (toClient > 0) _safeTransfer(client, toClient);

        if (freelancerBps > 0) {
            IJobFactory(factory).mintReputationSBT(freelancer, address(this));
        }
        emit PaymentReleased(toFreelancer, fee);
    }

    function _safeTransfer(address to, uint256 transferAmount) internal {
        if (transferAmount == 0) return;
        if (paymentToken == address(0)) {
            (bool ok, ) = payable(to).call{value: transferAmount}("");
            require(ok, "Transfer failed");
        } else {
            IERC20(paymentToken).safeTransfer(to, transferAmount);
        }
    }
}
