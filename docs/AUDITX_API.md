# AuditX API Contract & Integration Specification

> **Audience**: Backend Scanning Engine Engineering Team & PolyLance Core Team  
> **Status**: Proposed Frontend Integration Specification (Awaiting Backend Confirmation)  
> **Last Updated**: 2026-10-24  
> **Security Classification**: PolyLance Engineering Confidential  

---

## 1. Overview & Architectural Boundaries

AuditX provides automated static analysis and vulnerability scanning for smart contracts submitted by PolyLance users (freelancers, clients, and teams), as well as an internal-only security hardening report for PolyLance core protocol contracts.

- **Frontend Scope (This Codebase)**: Public landing page, scan upload workspace, user scan lifecycle monitoring, interactive findings reporting, and admin-gated internal report viewer.
- **Backend Scope (External Team Codebase)**: Sandboxed static analysis pipeline (AST parsing, symbolic execution, pattern matching), vulnerability database, file extraction, rate limiting, and persistence.

---

## 2. Authentication & Authorization Model

All requests to non-public endpoints (`/api/auditx/scans*`, `/api/auditx/internal-report`) require authenticated sessions.

1. **Session Propagation**:
   - Web3 wallet signature session token passed via standard HTTP-only session cookies (`polylance_session`) or Bearer token header: `Authorization: Bearer <session_jwt>`.
2. **User Identity & Ownership Enforcement**:
   - The backend **must** extract the wallet address (`userId`) strictly from the verified session claims.
   - Any query or path parameter claiming identity must be ignored.
   - **IDOR Protection**: Any attempt by user $A$ to access scan $S_B$ belonging to user $B$ **must** immediately return `404 Not Found` or `403 Forbidden`.
3. **Admin Privilege Enforcement**:
   - `/api/auditx/internal-report` requires `isAdmin: true` in the verified session claims. Non-admin calls **must** return `403 Forbidden`.

---

## 3. Proposed Endpoints

### 3.1 `GET /api/auditx/capabilities`
*Public endpoint (no auth required). Cached for 5 minutes.*

Returns the static capabilities, limits, supported compilers, and vulnerability check categories supported by the active engine.

#### Response `200 OK`
```json
{
  "version": "2.4.0",
  "supportedLanguages": ["Solidity"],
  "allowedExtensions": [".sol", ".zip"],
  "maxFileSizeBytes": 2097152,
  "maxTotalSizeBytes": 10485760,
  "maxFilesCount": 20,
  "retentionDays": 30,
  "pricing": {
    "tier": "free_preview",
    "scansPerDay": 15,
    "maxLinesPerScan": 5000
  },
  "privacy": {
    "isolatedPerUser": true,
    "codeEncryptedAtRest": true,
    "noPublicTraining": true,
    "deletionOnRequest": true,
    "needsConfirmation": true
  },
  "supportedCompilers": [
    "v0.8.28",
    "v0.8.26",
    "v0.8.24",
    "v0.8.20",
    "v0.8.19",
    "v0.7.6"
  ],
  "categories": [
    {
      "id": "reentrancy",
      "name": "Reentrancy Vulnerabilities",
      "description": "Detects state variable updates occurring after external calls (CEI violations).",
      "severityDefault": "Critical",
      "needsConfirmation": false
    },
    {
      "id": "access-control",
      "name": "Access Control & Authorization",
      "description": "Unprotected administrative initializers, missing onlyOwner or custom role checks.",
      "severityDefault": "High",
      "needsConfirmation": false
    },
    {
      "id": "arithmetic",
      "name": "Integer & Precision Issues",
      "description": "Checks division before multiplication, rounding discrepancies, unsafe type casting.",
      "severityDefault": "Medium",
      "needsConfirmation": true
    },
    {
      "id": "unchecked-calls",
      "name": "Unchecked Return Values",
      "description": "Low-level .call() or ERC-20 transfer() without validating return boolean.",
      "severityDefault": "Medium",
      "needsConfirmation": false
    },
    {
      "id": "gas-logic",
      "name": "Gas Optimization & Loop DOS",
      "description": "Unbounded array iterations, state reads inside loops, redundant storage ops.",
      "severityDefault": "Low",
      "needsConfirmation": true
    },
    {
      "id": "best-practice",
      "name": "Code Quality & Informational",
      "description": "Missing NatSpec, hardcoded constants, floating pragmas, locked Ether.",
      "severityDefault": "Informational",
      "needsConfirmation": false
    }
  ]
}
```

---

### 3.2 `POST /api/auditx/scans`
*Authenticated user.*

Submits a new scan request. Supports both `multipart/form-data` (file upload) and `application/json` (inline code snippet or verified Polygon contract address).

#### Request Example (JSON - Snippet or Address)
```json
{
  "targetType": "code",
  "projectName": "EscrowMilestoneV2",
  "language": "Solidity",
  "compilerVersion": "v0.8.24",
  "notes": "Pre-release scan before deployment",
  "codeSnippet": "pragma solidity ^0.8.24;\ncontract Escrow { ... }"
}
```

#### Request Example (Multipart - Files)
- `targetType`: `"files"`
- `language`: `"Solidity"`
- `compilerVersion`: `"v0.8.24"`
- `files`: Binary stream of `.sol` or `.zip` files.

#### Response `201 Created`
```json
{
  "id": "scan_8f9e12a4b0c2",
  "userId": "0x1234567890abcdef1234567890abcdef12345678",
  "targetType": "code",
  "targetName": "EscrowMilestoneV2.sol",
  "projectName": "EscrowMilestoneV2",
  "language": "Solidity",
  "compilerVersion": "v0.8.24",
  "status": "queued",
  "progress": 0,
  "elapsedMs": 0,
  "createdAt": "2026-10-24T14:30:00Z",
  "severitySummary": {
    "Critical": 0,
    "High": 0,
    "Medium": 0,
    "Low": 0,
    "Informational": 0
  },
  "canCancel": true
}
```

---

### 3.3 `GET /api/auditx/scans`
*Authenticated user.*

Returns the list of recent scans created by the authenticated user, ordered by `createdAt DESC`.

#### Response `200 OK`
```json
[
  {
    "id": "scan_8f9e12a4b0c2",
    "userId": "0x1234...",
    "targetType": "files",
    "targetName": "StakingPool.sol",
    "projectName": "Staking Rewards",
    "language": "Solidity",
    "compilerVersion": "v0.8.24",
    "status": "completed",
    "progress": 100,
    "elapsedMs": 3420,
    "createdAt": "2026-10-24T14:00:00Z",
    "completedAt": "2026-10-24T14:00:04Z",
    "severitySummary": {
      "Critical": 0,
      "High": 1,
      "Medium": 2,
      "Low": 1,
      "Informational": 1
    }
  }
]
```

---

### 3.4 `GET /api/auditx/scans/:id`
*Authenticated user.*

Returns the live status of an individual scan job (polled by the UI during execution with exponential backoff).

#### Status Enum:
- `queued`: Waiting in worker queue.
- `scanning`: Active AST/symbolic analysis underway (`progress` between 1 and 99).
- `completed`: Analysis finished; report is ready at `/api/auditx/scans/:id/report`.
- `failed`: Scanner encountered an unrecoverable compilation or timeout error.
- `cancelled`: Scan was terminated by the user.

#### Response `200 OK`
```json
{
  "id": "scan_8f9e12a4b0c2",
  "userId": "0x1234...",
  "status": "scanning",
  "progress": 65,
  "elapsedMs": 2100,
  "createdAt": "2026-10-24T14:30:00Z"
}
```

---

### 3.5 `GET /api/auditx/scans/:id/report`
*Authenticated user.*

Returns the complete vulnerability findings report for a completed scan.

#### Response `200 OK`
```json
{
  "id": "rep_9a8b7c6d5e4f",
  "scanId": "scan_8f9e12a4b0c2",
  "projectName": "EscrowMilestoneV2",
  "targetType": "code",
  "targetSummary": "EscrowMilestoneV2.sol (184 lines)",
  "language": "Solidity",
  "compilerVersion": "v0.8.24",
  "createdAt": "2026-10-24T14:30:05Z",
  "scanDurationMs": 3420,
  "status": "has_findings",
  "severityCounts": {
    "Critical": 0,
    "High": 1,
    "Medium": 2,
    "Low": 1,
    "Informational": 1
  },
  "totalFindings": 5,
  "findings": [
    {
      "id": "find_001",
      "title": "Unprotected Ether Withdrawal Function",
      "severity": "High",
      "status": "Open",
      "contractOrFile": "EscrowMilestoneV2.sol",
      "functionTarget": "emergencyRefund()",
      "lineStart": 42,
      "lineEnd": 48,
      "codeSnippet": "function emergencyRefund() external {\n    payable(msg.sender).transfer(address(this).balance);\n}",
      "description": "Function emergencyRefund() is declared external but lacks an access control modifier.",
      "recommendation": "Add the onlyOwner or onlyAdmin modifier and follow the Checks-Effects-Interactions pattern.",
      "cwe": "CWE-284",
      "swc": "SWC-105",
      "referenceUrl": "https://swcregistry.io/docs/SWC-105"
    }
  ],
  "limitationsNotice": "Automated analysis is an automated tool and cannot find every potential vulnerability or guarantee code safety. This is not a substitute for a professional third-party smart contract audit."
}
```

---

### 3.6 `DELETE /api/auditx/scans/:id`
*Authenticated user.*

Purges the scan job, AST cache, and associated findings report immediately from server storage.

#### Response `204 No Content`

---

### 3.7 `POST /api/auditx/scans/:id/cancel`
*Authenticated user.*

Requests cooperative termination of an ongoing scan in `queued` or `scanning` state.

#### Response `200 OK`

---

### 3.8 `GET /api/auditx/internal-report`
*Admin Only (`isAdmin: true` required).*

Returns the internal PolyLance Smart Contract Security Report for the core protocol contracts (JobEscrow, JobFactory, ReputationSBT, JudgeDAO, Timelock).

#### Response `200 OK` (Admin)
Returns the comprehensive JSON dataset containing protocol audit status, test coverage, internal hardening findings, and timelock verification parameters.

#### Response `403 Forbidden` (Non-Admin or Unauthenticated)
```json
{
  "error": "Forbidden: This report is restricted to PolyLance administrators.",
  "code": "ADMIN_ROLE_REQUIRED"
}
```

---

## 4. Requirements for the Backend Team

1. **Strict User Isolation & IDOR Protection**:
   - Every scan record and uploaded file path must be keyed by the authenticated `userId`.
   - Never allow user $A$ to read, query, cancel, or delete scans created by user $B$.
   - Scan IDs must be cryptographically random (e.g. UUIDv4 or 128-bit hex string) to prevent sequential enumeration attacks.

2. **Server-Side Admin Role Enforcement**:
   - The internal report endpoint `/api/auditx/internal-report` must verify the admin claim cryptographically against the configured admin multisig/wallets.
   - UI hiding alone is insufficient; any non-admin request must receive HTTP `403 Forbidden`.

3. **Secure Sandboxing & Execution Isolation**:
   - Uploaded smart contracts must **never** be executed directly.
   - Static analysis tools (Slither, Mythril, Solhint, or proprietary engines) must run inside ephemeral, unprivileged Linux containers with read-only root filesystems, dropped capabilities (`CAP_DROP_ALL`), and no access to the host network or internal cloud metadata services (`169.254.169.254`).

4. **Malware, Decompression & Zip-Bomb Protections**:
   - Strict archive decompression limits: maximum uncompressed size 20 MB, maximum 50 files, maximum compression ratio 10:1.
   - Ban directory traversal tokens in zip headers (`../`, absolute paths, symlinks).
   - Reject binary files, executable formats (`.exe`, `.so`, `.sh`), and any extension outside the confirmed list (`.sol`, `.zip`).

5. **Rate Limiting & Abuse Prevention**:
   - Rate limit scan creation per wallet address and per client IP (e.g., maximum 5 scans per minute, 15 scans per day on the free tier).
   - Return HTTP `429 Too Many Requests` with a standard `Retry-After` header when quotas are exceeded.

6. **Encryption at Rest & in Transit**:
   - All network traffic must enforce TLS 1.3.
   - Source code snippets and uploaded files stored temporarily during analysis must be encrypted at rest (AES-256-GCM or cloud KMS).

7. **Retention & Deletion Policy**:
   - User code and scan reports must be automatically expunged after the confirmed retention window (default 30 days).
   - Explicit `DELETE /api/auditx/scans/:id` requests must execute hard deletion of source files and DB records within 60 seconds.

8. **Sanitized Logging**:
   - Application logs must **never** dump full user smart contract code, private notes, or file contents into centralized log collectors (Datadog, CloudWatch, etc.). Only log scan metadata (ID, userId hash, duration, findings count, exit status).

9. **Strict CORS Policy**:
   - Cross-Origin Resource Sharing (CORS) headers on `/api/auditx/*` must be strictly restricted to `https://polylance.codes` (and `http://localhost:5173` in local development). Wildcards (`*`) with credentials are explicitly prohibited.

---

## 5. Items Flagged `needsConfirmation` (Pending Backend Confirmation)

The frontend implementation marks the following items with `needsConfirmation: true`:

1. **Arithmetic & Precision Checks**:
   - Engine support for detecting integer precision issues and rounding errors under Solc 0.8+ checked arithmetic.
2. **Gas Optimization & Loop DOS**:
   - Whether gas estimation metrics and loop DOS checks will be part of the initial launch or reserved for v2.
3. **Data Retention & Encryption Policies**:
   - Confirmation of 30-day automatic retention schedule and AES-256 storage encryption parameters.
4. **Multiple File & Zip Archive Support**:
   - Confirmation that the backend compiler pipeline handles multi-file contract imports within uploaded `.zip` archives.
