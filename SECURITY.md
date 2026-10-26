# PolyLance Security Policy & Operations Guide

> **Important Scope & Disclaimer**: This document details the security posture, operational procedures, and hardening measures implemented across the PolyLance application ecosystem. This review represents a comprehensive security hardening and common-mistakes audit; it is **NOT** a formal external smart contract audit. Smart contracts deployed on Polygon PoS (Chain 137) are immutable and evaluated on a report-only basis.

---

## 1. Vulnerability Reporting & Responsible Disclosure

We take the security of PolyLance, our smart contract escrows, and user funds seriously. If you discover a vulnerability or security flaw, please disclose it responsibly.

- **Primary Contact**: `security@polylance.codes`
- **Response SLA**: Initial triage within 24 hours; critical fix deployment within 48 hours.
- **Reporting Guidelines**:
  - Provide detailed reproduction steps or proof-of-concept scripts.
  - Do **NOT** exploit vulnerabilities against live production escrows or real user balances.
  - Do **NOT** disclose the vulnerability publicly until a patch has been deployed and verified.
- **Scope**:
  - Web Frontend: `https://polylance.codes`
  - Chat & Coordination API: `https://polylance.codes/api`
  - Escrow Factory, Timelock, and Reputation SBT contracts on Polygon Mainnet (137) and Amoy (80002).

---

## 2. Authentication & Authorization Architecture

### 2.1 Cryptographic SIWE (EIP-4361)
PolyLance has eliminated all self-asserted identity vectors (`x-wallet-address` headers, `?wallet=0x...` query params, and client-asserted body payloads).

1. **Nonce Generation (`GET /api/auth/nonce`)**:
   - Generates a cryptographically random, single-use, 5-minute expiring nonce bound to the user's EIP-55 checksummed wallet address and Chain ID `137`.
2. **Signature Verification (`POST /api/auth/verify`)**:
   - Validates the EIP-4361 SIWE message.
   - Recovers the signer using `ethers.verifyMessage` (with EIP-1271 fallback for contract wallets).
   - Burns the nonce immediately to prevent replay attacks.
   - Issues a cryptographically signed HMAC-SHA256 session token stored in an `HttpOnly`, `SameSite=Lax`, `Secure` cookie named `polylance_session`.
3. **Session Guards**:
   - `requireAuth`: Enforces that `req.session.wallet` is active and valid.
   - `isPartyToJob`: Enforces that caller is explicitly the client, freelancer, or platform admin for that job.
   - `requireAdmin`: Enforces that caller matches the multi-sig administrative governor.

---

## 3. Financial & Money-State Rules

- **Zero Client-Asserted State Overwrites**: The `/api/sync` endpoint cannot mutate jobs, balances, or financial statuses (`Completed`, `Released`, `Refunded`).
- **Cryptographic Payment Verification**:
  - State promotion to `Completed` strictly requires on-chain transaction verification (`RpcPool.getTransactionReceipt`) or indexer confirmation (`Release` event emitted by `JobEscrow` bytecode).
  - Escrow funds are locked until on-chain release or timelocked judge dispute resolution.

---

## 4. Credential Rotation Runbook (ROTATE NOW)

The following 8 credentials were flagged during audit and must be rotated upon deployment:

| # | Credential Key | Service | Rotation Procedure |
|---|---|---|---|
| 1 | `SESSION_SECRET` | Backend Auth | Generate 64-byte hex: `openssl rand -hex 64`. Update `.env`, restart server. Existing sessions will expire and require re-login. |
| 2 | `DATABASE_URL` | PostgreSQL | Issue new password via Supabase/RDS/Neon dashboard. Update connection string in backend environment. Restart service. |
| 3 | `GITHUB_CLIENT_SECRET` | GitHub OAuth | Navigate to GitHub Developer Settings → OAuth Apps → PolyLance. Generate a new client secret, update `.env`, and revoke the old secret. |
| 4 | `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis | Log into Upstash Console → PolyLance Redis DB → REST API Credentials. Click "Rotate Token", update `.env`. |
| 5 | `FILEBASE_SECRET_KEY` | Filebase IPFS | Log into Filebase Console → Access Keys. Create a new secret key, update backend config, and delete the exposed key. |
| 6 | `DEPLOYER_PRIVATE_KEY` | Deployer Wallet | Generate new wallet via Hardware Wallet / Safe. Transfer ownership of deployer address `0xc0Af7383...` to the new Safe. Never store keys in plaintext files. |
| 7 | `POLYGONSCAN_API_KEY` | Polygonscan | Log into Polygonscan.com → API-KEYs. Generate a new API key, replace in `.env`, and delete the previous key. |
| 8 | `PINATA_API_SECRET` / `JWT` | Pinata Cloud | Log into Pinata Cloud → API Keys. Revoke exposed keys. Secrets must never exist in `frontend/.env` (client bundles). |

---

## 5. Database Backup & Disaster Recovery

### 5.1 Automated PostgreSQL Backup
Run the backup script before running any schema migrations or structural updates:
```bash
pg_dump -U postgres -h localhost -d polylance_db -F c -b -v -f "./backups/polylance_db_backup_$(date +%Y%m%d_%H%M%S).dump"
```

### 5.2 Database Restoration
```bash
pg_restore -U postgres -h localhost -d polylance_db -v -c "./backups/polylance_db_backup_<timestamp>.dump"
```

### 5.3 On-Chain Data Anchoring
All Soulbound Token records (`PL-SBT #0`, `PL-SBT #1`, `PL-SBT #2`) are permanently anchored on Polygon PoS (Chain 137) at contract `0x22A61f83cEB94233d30a20EEacBdEB9BCC1C2879`. In the event of catastrophic database loss, the backend automatically re-indexes token ownership directly from contract event logs (`Transfer(address(0), holder, tokenId)`).

---

## 6. Administrative Governance & Timelock Rules

- **Multi-Sig Control**: Privileged operations (escrow implementation upgrades, DAO judge whitelist changes) require 2-of-3 threshold approval via Gnosis Safe.
- **Timelock Delay**: Protocol configuration updates pass through the `TimelockController` contract (`0x45602bE11306651C7FA5c96Bc7fa5051BA4a856f`) with a mandatory 48-hour execution delay.
- **No Private Key Backdoors**: Zero developer backdoor keys exist in smart contract bytecode or API routes.
