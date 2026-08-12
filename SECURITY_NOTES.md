# PolyLance Security Notes & Governance Design Tradeoffs

## 1. JudgeDAO Dynamic Quorum (20% of Total ReputationSBT Supply)

### Design & Quorum Fraction
`JudgeDAO.sol` inherits OpenZeppelin's `GovernorVotesQuorumFraction(20)`. Quorum is evaluated dynamically as **20% of total ReputationSBT supply** at the proposal snapshot block (`proposalSnapshot(proposalId)`).

### Tradeoff & Bootstrap Security Analysis
- **Scalability:** Unlike a static hardcoded integer (e.g. `MIN_QUORUM = 5`), a percentage scales with network growth. At 1,000 active ReputationSBT holders, quorum requires 200 votes.
- **Early Bootstrap Phase Risk (Accepted Risk):** At low holder counts (e.g. 10 total SBT holders early on), 20% quorum requires only 2 votes to pass a proposal. This is an accepted, documented risk during early growth, not an oversight.
- **Mitigation:** Protocol administrative roles on `JobFactory` are held by a multi-sig Gnosis Safe during early growth until total SBT supply reaches broad distribution across independent judges and freelancers.

---

## 2. Timelock Controller (2-Day Execution Delay)

### Design & Architecture
`JudgeDAO` is bound to OpenZeppelin's `TimelockController` with a **2-day minimum delay (`172,800` seconds)**:
- `PROPOSER_ROLE` on `TimelockController` is granted exclusively to `JudgeDAO`.
- `EXECUTOR_ROLE` is set to `address(0)` (open execution by anyone once `minDelay` expires).
- `JobFactory` grants `DEFAULT_ADMIN_ROLE` to the `TimelockController` address so executed proposals can grant or revoke `ARBITRATOR_ROLE`.

### Tradeoff Analysis
- **Protection:** Prevents malicious or outgoing judges from front-running a pending removal vote by rushing through unfavorable dispute rulings before execution completes.
- **Symmetric Delay Tradeoff (Accepted Tradeoff):** Uniform timelock delay means both **judge removals** AND **judge additions** require 2 days to take effect post-vote. This is an intentional simplification over custom asymmetric timing logic to preserve standard OpenZeppelin audited governance contracts.

---

## 3. Slither Static Analysis Triage & Defense

- **`arbitrary-send-eth` (`withdrawTreasury`)**: ACCEPTED — Intentional core treasury mechanism gated strictly by `TREASURY_ADMIN_ROLE` pointing to the Gnosis Safe multi-sig.
- **`reentrancy-events` / `reentrancy-benign` / `locked-ether` (Attacker Mocks)**: ACCEPTED — `MaliciousReentrancyAttacker.sol` and test mock contracts are test-only exploit harness contracts designed specifically to attempt reentrancy attacks.
- **`timestamp` comparisons**: ACCEPTED — Used exclusively for multi-day dispute review windows (`DEFAULT_REVIEW_PERIOD = 7 days`) where miner block timestamp drift (±15s) is mathematically immaterial.
- **`JudgeDAO` abstract methods**: VERIFIED FALSE POSITIVE — `GovernorCountingSimple` and `GovernorVotes` provide concrete implementations of `_quorumReached`, `_voteSucceeded`, and `clock()`. `npx hardhat compile` succeeds 100%.
- **`missing-zero-check`**: FIXED — Added explicit `require(_client != address(0))` in `JobEscrow.sol` and `require(_jobImplementation != address(0))` / `require(to != address(0))` in `JobFactory.sol`.
