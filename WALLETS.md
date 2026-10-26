# PolyLance Wallet Compatibility & Network Fee Matrix

## Overview
This document serves as the authoritative, verified reference for Web3 wallet behaviors on Polygon PoS when interacting with PolyLance smart contracts (Milestone Escrows, ERC-20 payment tokens, EIP-2612 permits, and SBT attestations).

Every claim is categorized with strict evidence levels:
- **`[Verified by Test]`**: Directly tested and confirmed against Polygon PoS / Amoy testnet using browser automation and live RPC telemetry.
- **`[From Official Docs]`**: Verified via official wallet technical specifications and developer documentation.
- **`[Unverified]`**: Expected standard EVM behavior, not yet empirically proven in PolyLance environment.

---

## 1. The "0.1 POL" Phenomenon Explained

### Observation
Users occasionally report that MetaMask or hardware signers "charge 0.1 POL" per contract transaction, leading them to believe either PolyLance or the wallet is deducting a fixed 0.1 POL fee.

### Root Cause Mathematical Proof `[Verified by Test]`
1. **Bor Tip Cap Constraint**: Polygon Bor consensus enforces a mandatory minimum priority fee (tip cap) of at least 25 to 30 Gwei (`30,000,000,000 Wei`). Transactions specifying priority fees below this threshold are immediately dropped by Polygon RPC nodes with error:
   `"transaction gas price below minimum: gas tip cap 1500000000, minimum needed 25000000000"`
2. **Buffer in Gas Strategy**: To guarantee inclusion during rapid gas volatility on Polygon, PolyLance provides EIP-1559 gas parameters specifying a conservative `maxFeePerGas` (up to 450–600 Gwei) and a `gasLimit` buffer (typically 150,000 to 220,000 gas units for smart contract operations like `fundJob` or `releasePayment`).
3. **EIP-1559 Worst-Case Display**:
   MetaMask and EIP-1559 wallets calculate the displayed **Max Fee** as:
   $$\text{Max Fee} = \text{gasLimit} \times \text{maxFeePerGas} = 200,000 \times 450\text{ to }600\text{ Gwei} = \mathbf{0.09\text{ to }0.12\text{ POL} \approx 0.1\text{ POL}}$$
4. **Up-Front Balance Requirement**: EIP-1559 requires the wallet balance to cover $\text{Value} + \text{Max Fee}$ at transaction broadcast time. If a user holds only 0.05 POL, MetaMask prompts *"Insufficient funds for gas"*.
5. **Reality of Actual Cost**: Once mined, Polygon only consumes the actual gas used (typically ~50,000 to 142,000 units) at the actual block base fee + priority fee (~65 to 120 Gwei). The actual cost deducted is only:
   $$\text{Actual Gas Paid} = 142,000 \times 70\text{ Gwei} = \mathbf{0.00994\text{ POL}} \approx \mathbf{0.01\text{ POL}}$$
   The remaining 0.09 POL is never charged. PolyLance and wallet apps receive **0%** of network fees. All fees are burned or disbursed to Polygon PoS validators.

---

## 2. Wallet Compatibility Matrix

| Wallet | Fee Fields Displayed | Wallet Fee on Contract Calls | Balance Verification Rule | Priority Fee Floor Handling | Honors Dapp Gas Overrides? | Evidence Level |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **MetaMask (Browser Extension)** | Estimated Fee, Max Fee (in Details tab), Speed Presets (Low, Market, Aggressive). | **0%** (MetaMask only charges on swaps/bridges/buys). | **Strict**: Blocks submission if `balance < value + maxFee`. | Default RPC estimate (1.5 Gwei) gets dropped on Polygon unless overridden by dapp. | **YES**: Accurately adheres to `maxFeePerGas` and `maxPriorityFeePerGas` passed by dapp. | **Verified by Test & Official Docs** |
| **MetaMask (Mobile iOS / Android)** | Estimated Network Fee, Max Fee accordion. | **0%**. | **Strict**: Rejects if balance < max gas. | Follows extension logic. | **YES**: Honors EIP-1559 params. | **Verified by Test & Official Docs** |
| **Rabby Wallet** | Detailed Base Fee + Tip breakdown, pre-simulates balance delta & state changes. | **0%**. | Simulates transaction; warns if wallet balance is insufficient for gas. | Automatic built-in gas oracle respects chain minimums (30 Gwei on Polygon). | **YES**: Shows dapp params with comparison to internal oracle. | **Verified by Test & Official Docs** |
| **Coinbase Wallet (Ext & Mobile)** | Estimated Network Fee, Speed Presets (Slow, Normal, Fast). | **0%**. | Requires balance to cover gas limit times max fee. | Adapts to network floor. | **YES**: Honors custom overrides. | **From Official Docs** |
| **Trust Wallet (Mobile)** | Network fee estimate, Advanced gas settings. | **0%**. | Blocks if `balance < gas`. | Recommends network standard. | **YES**. | **From Official Docs** |
| **Phantom (EVM)** | Estimated Network Fee, Priority slider. | **0%**. | Checks native balance. | Built-in floor. | **YES**. | **From Official Docs** |
| **Rainbow** | Animated Gas estimate, Presets (Normal, Fast, Custom). | **0%**. | Blocks if balance insufficient for max gas. | Network floor detection. | **YES**. | **From Official Docs** |
| **OKX Wallet** | Gas estimate, Max gas, Presets. | **0%**. | Checks balance against max gas. | Adapts to network floor. | **YES**. | **From Official Docs** |
| **Brave Wallet** | Estimated gas, Max gas, Priority fee. | **0%**. | Strict balance check against max fee. | Node default. | **YES**. | **From Official Docs** |
| **Safe (Multisig)** | Safe transaction gas estimate (relayed / signer-paid). | **0%**. | Handled at Safe execution layer or sponsored by relayer. | Safe relayer manages tip caps. | **YES**. | **From Official Docs** |
| **Ledger / Trezor via MetaMask** | Physical hardware device screen prompts `Max Fee: 0.1 POL` and `Value`. | **0%**. | Verified on hardware chip before signature. | Host machine sets gas values. | **YES**: Hardware screen mirrors whatever MetaMask sets as max fee. | **Verified by Test & Official Docs** |
| **WalletConnect Mobile Apps** | Displays native wallet confirmation view. | **0%**. | Follows specific mobile wallet engine. | Depends on mobile app implementation. | **YES**. | **From Official Docs** |

---

## 3. Recommended Wallet Balance Reserves
- **For Clients (Funding Escrows)**: Maintain at least **0.1 POL** in your wallet to cover up-front EIP-1559 max fee pre-checks for contract funding and ERC-20 approvals.
- **For Freelancers (Applying & Earning)**:
  - Applying to a job requires **0 POL** (off-chain signature/database).
  - Receiving escrow payouts requires **0 POL** (the client pays the gas to trigger `releasePayment`).
  - Submitting deliverables on-chain requires **~0.003 POL** (maintain at least 0.05 POL for safety).

---

## 4. Dapp Best Practices Implemented in PolyLance
1. **Dynamic Pre-Flight Balance Check**: PolyLance pre-checks the user's balance against the live `walletMaxTotalWei` returned by `/api/network/fees` before calling the wallet, preventing opaque *"Insufficient funds for gas"* wallet errors.
2. **Transparent UI Disclosures**: Payment dialogs display both the live **Typical Network Fee** (~0.012 POL) and the **Wallet Maximum** (~0.04 POL) with a clear explanation that unused gas is automatically refunded.
3. **No Monolithic Mixed Lists**: The job fee breakdown separates Client deposit ($1,500 + 37.50 = 1,537.50$) from Freelancer net ($1,500 - 37.50 = 1,462.50$) via a role-aware toggle.
