# PolyLance Blog: Factual Claims Verification Matrix

This document catalogs every factual, contractual, technical, and architectural claim made across all 15 blog posts on PolyLance. Every claim is cross-referenced against the actual deployed Solidity contracts, on-chain parameters, and protocol architecture to ensure total veracity and prevent misleading claims.

---

## 1. Summary of Contract & Architectural Truths

| Parameter | Actual On-Chain Implementation | Smart Contract / File Source | Blog Status |
| :--- | :--- | :--- | :--- |
| **Escrow Model** | Non-custodial, deterministic bytecode per milestone | `contracts/JobEscrow.sol` | Verified |
| **Blockchain Network** | Polygon PoS (Chain ID `137`), Amoy Testnet (`80002`) | `hardhat.config.ts`, `SITE.contracts` | Verified |
| **Platform Fee** | `2.5%` client deposit + `2.5%` freelancer deduction (`5.0%` total) | `contracts/JobEscrow.sol`, `site.config.ts` | Tokenized: `{{PLATFORM_FEE_PERCENT}}`, `{{PLATFORM_FEE_TOTAL}}` |
| **Review Window** | `7 days` (`604,800` seconds) client review duration | `contracts/JobEscrow.sol`, `site.config.ts` | Tokenized: `{{REVIEW_WINDOW_DAYS}}` |
| **Auto-Release** | `claimAutoRelease()` executable on-chain after review expiry | `contracts/JobEscrow.sol` (`claimAutoRelease()`) | Verified |
| **Settlement Time** | Instant upon block confirmation when client calls `releasePayment()` | Polygon PoS Block Confirmation | Verified (~2 sec) |
| **Reputation Token** | ERC-5192 Soulbound Token (non-transferable, immutable metadata) | `contracts/ReputationSBT.sol`, `ReputationSBT_v2.sol` | Verified |
| **Arbitration / Dispute** | JudgeDAO decentralized multisig / panel resolution | `contracts/JudgeDAO.sol`, `contracts/JobEscrow.sol` | Verified |
| **Proof of Work** | IPFS SHA-256 multihash stored in event log and contract storage | `contracts/JobEscrow.sol` (`submitDeliverable`) | Verified |
| **Payment Currencies** | USDC (`6` decimals) and POL / native Polygon (`18` decimals) | `JobEscrow.sol`, `site.config.ts` | Verified |

---

## 2. Post-by-Post Claims Audit

### Post 1: `what-is-crypto-escrow-and-how-does-it-work`
- **Claim**: *"Non-custodial smart contract on Polygon (`JobEscrow.sol`)"*
  - **Verification**: Verified. `JobEscrow.sol` holds funds in escrow without private-key custody by any platform operator or admin.
- **Claim**: *"Platform Fee: 2.5% per side (5.0% total)"*
  - **Verification**: Verified against `JobEscrow.sol` (`FEE_BPS = 250`). Resolved via `{{PLATFORM_FEE_PERCENT}}` and `{{PLATFORM_FEE_TOTAL}}`.
- **Claim**: *"Settlement Time: Instant upon client approval"*
  - **Verification**: Verified. Calling `releasePayment()` on `JobEscrow.sol` immediately transfers tokens to the freelancer's wallet address in the same transaction.
- **Claim**: *"Network Finality: ~2 seconds on Polygon PoS"*
  - **Verification**: Verified. Polygon PoS average block time is 2.1 seconds.
- **Claim**: *"Transparency: 100% publicly verifiable on Polygonscan"*
  - **Verification**: Verified. All events (`EscrowFunded`, `DeliverableSubmitted`, `PaymentReleased`) are public on Chain ID 137.
- **Claim**: *"If the client fails to review the work within the review window, the freelancer can invoke `claimAutoRelease()` directly on-chain."*
  - **Verification**: Verified against `JobEscrow.sol::claimAutoRelease()`. Requires `block.timestamp >= deliverableSubmittedAt + reviewWindow`.

### Post 2: `how-to-get-paid-in-usdc-guide`
- **Claim**: *"USD Coin (USDC) is a regulated, dollar-backed digital stablecoin issued by Circle."*
  - **Verification**: Verified. Native USDC on Polygon PoS is issued by Circle (`0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359`).
- **Claim**: *"Immediate Settlement: Funds arrive in your self-custody wallet within seconds of client milestone approval."*
  - **Verification**: Verified against `JobEscrow.sol`.
- **Claim**: *"Polygon gas costs negligible amounts of POL (fractions of a cent)."*
  - **Verification**: Verified. Average transfer cost on Polygon is ~0.005 - 0.015 POL (<$0.01).

### Post 3: `web3-freelance-escrow-guide`
- **Claim**: *"When entering an engagement on PolyLance, milestone terms and payment balances are programmed into `JobEscrow.sol` deployed on Polygon Mainnet."*
  - **Verification**: Verified.
- **Claim**: *"The protocol mints an ERC-5192 Soulbound Reputation Token to the freelancer's wallet, recording verified project completion on-chain."*
  - **Verification**: Verified against `contracts/ReputationSBT.sol`. Implements `IERC5192` with `locked(tokenId) == true`.
- **Claim**: *"7-day review window following deliverable submission."*
  - **Verification**: Verified against `REVIEW_WINDOW_DAYS` in `site.config.ts` and `JobEscrow.sol`.

### Post 4: `transparent-freelance-pricing-breakdown`
- **Claim**: *"Dual-sided 2.5% protocol fee model (5.0% total platform take rate)."*
  - **Verification**: Verified. Client pays budget + 2.5%, freelancer receives budget - 2.5%.
- **Claim**: Table calculations:
  - 10.00 USDC -> Client 0.25 USDC (10.25 total), Freelancer net 9.75 USDC.
  - 100.00 USDC -> Client 2.50 USDC (102.50 total), Freelancer net 97.50 USDC.
  - **Verification**: Mathematically exact matching `JobEscrow.sol` basis points (`250 / 10000 = 0.025`).

### Post 5: `how-to-avoid-freelance-payment-scams`
- **Claim**: *"Always verify the domain is `https://polylance.codes` and check the contract on Polygonscan."*
  - **Verification**: Verified canonical production domain and contract verification rules.
- **Claim**: *"Only sign messages that explicitly display the domain `polylance.codes` and an EIP-4361 SIWE nonce."*
  - **Verification**: Verified against `polylance-chat-service/src/auth.ts` (`ALLOWED_SIWE_DOMAINS` and `generateAuthNonce`).

### Post 6: `how-to-hire-solidity-smart-contract-developer`
- **Claim**: *"Market rates for smart contract developers in 2026: Junior $40-80/hr, Senior $100-200/hr, Auditor $150-300/hr."*
  - **Verification**: Market estimate based on Web3 developer compensation indices. Clear educational context provided.

### Post 7: `how-to-find-web3-freelance-jobs-india`
- **Claim**: *"Payment in USDC or POL settled directly to Polygon self-custody wallets."*
  - **Verification**: Verified against protocol multi-token support (`POL` and `USDC`).

### Post 8: `why-polygon-is-ideal-for-freelance-payments`
- **Claim**: *"Sub-cent transaction fees on Polygon PoS vs tens of dollars on Ethereum L1."*
  - **Verification**: Verified on-chain metric.
- **Claim**: *"Block time of approximately 2 seconds on Polygon PoS."*
  - **Verification**: Verified against Polygon consensus specifications.

### Post 9: `what-is-pol-token-matic-upgrade-freelancers`
- **Claim**: *"POL is the upgraded native gas and staking token of Polygon PoS, succeeding MATIC 1:1."*
  - **Verification**: Verified against Polygon 2.0 token upgrade contracts (`0x455e53CBB69018063a56A35541e21b0C8f3c7e93`).

### Post 10: `how-milestone-payments-protect-clients-freelancers`
- **Claim**: *"Funds locked in contract bytecode; neither client nor freelancer can unilaterally withdraw once funded."*
  - **Verification**: Verified in `JobEscrow.sol`.

### Post 11: `on-chain-work-certificates-freelance-portfolio`
- **Claim**: *"Soulbound tokens (ERC-5192) cannot be transferred between wallets."*
  - **Verification**: Verified in `ReputationSBT.sol` (`_beforeTokenTransfer` reverts on any transfer other than mint and burn).

### Post 12: `wallet-safety-guide-for-freelancers`
- **Claim**: *"EIP-712 structured data signing reveals the spender, amount, and recipient before broadcast."*
  - **Verification**: Standard Web3 cryptographic invariant.

### Post 13: `freelance-contract-template-crypto-payments-checklist`
- **Claim**: *"Arbitration through JudgeDAO provides binding on-chain distribution."*
  - **Verification**: Verified in `JudgeDAO.sol`.

### Post 14: `web3-freelance-skills-in-demand`
- **Claim**: *"Solidity, Rust (Solana/Near), React/Next.js Web3 frontends, and smart contract security auditing."*
  - **Verification**: Industry skills taxonomy.

### Post 15: `sovereign-freelance-work-reputation-guide`
- **Claim**: *"ERC-5192 specification establishes a minimal interface for soulbound tokens with `Locked` and `Unlocked` events."*
  - **Verification**: Verified against EIP-5192 standard specification.

---

## 3. Checklist for Content Creators & Editors
- [x] All platform fee references must use `{{PLATFORM_FEE_PERCENT}}` and `{{PLATFORM_FEE_TOTAL}}`.
- [x] Zero competitor platform mentions (Upwork, Fiverr, etc.) are allowed.
- [x] Contract names must reference actual code: `JobEscrow.sol`, `JobFactory.sol`, `ReputationSBT.sol`, `JudgeDAO.sol`.
- [x] Blockchain network must always be specified as **Polygon PoS (Chain ID 137)** or **Polygon Amoy (Chain ID 80002)**.
- [x] All external reference links must have `target="_blank" rel="noopener noreferrer"`.
