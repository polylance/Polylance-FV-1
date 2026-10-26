# PolyLance Resilient Payment & RPC Architecture Runbook

## Overview
This runbook provides operational instructions for managing PolyLance's resilient payment pipeline, multi-provider RPC pool, durable transaction manager, event indexer, and state reconciliation engine.

---

## 1. Architecture Summary
- **Chain as Source of Truth**: The Polygon PoS blockchain is the sole authority for monetary state.
- **Backend RPC Pool (`RpcPool.ts`)**: Server orchestrates queries through a resilient pool of RPC endpoints with circuit breakers, block lag monitoring, and 2-provider quorum verification for critical balance and payment checks.
- **Durable Transaction Manager (`TxManager.ts`)**: Generates deterministic transaction intents (`POST /api/tx/intent`), enforces tiered confirmation depths (3, 5, or 10 confirmations), tracks status independently of browser tab lifecycle, and detects dropped/replaced mempool transactions.
- **Event Indexer & Reconciler (`EventIndexer.ts`)**: Bounded 500-block range queries, 10-block reorg rewind window, cursor persistence, and automatic discrepancy detection against server database state.
- **Frontend Isolation**: Browser never polls public RPCs directly for state. All balances and transaction updates are delivered through server endpoints (`/api/account/balances`, `/api/tx/:intentId`, `/api/sync`).

---

## 2. Managing RPC Providers & Key Rotation

### Environment Configuration
The backend reads RPC providers from environment variables in `polylance-chat-service/.env`:

```env
# Multi-Provider JSON-RPC Endpoints (comma-separated URLs or dedicated env vars)
RPC_URL_PRIMARY="https://polygon-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY"
RPC_URL_SECONDARY="https://polygon-mainnet.infura.io/v3/YOUR_INFURA_KEY"
RPC_URL_FALLBACK_1="https://polygon-bor-rpc.publicnode.com"
RPC_URL_FALLBACK_2="https://polygon.gateway.tenderly.co"
RPC_URL_FALLBACK_3="https://1rpc.io/matic"
```

### Rotating an API Key (Zero-Downtime)
1. **Prepare New Key**: Generate the new API key in your provider dashboard (e.g., Alchemy / Infura).
2. **Update `.env`**: In `polylance-chat-service/.env`, update the target environment variable.
3. **Graceful Reload**: Restart or reload the backend service:
   ```bash
   cd polylance-chat-service
   npm run build
   # If running with PM2 or systemd:
   pm2 reload polylance-chat-service
   ```
4. **Verify Health**: Query the RPC health endpoint:
   ```bash
   curl http://localhost:3001/api/health/rpc
   ```
   Confirm that all configured providers show `circuitBreakerState: "CLOSED"`, `isHealthy: true`, and `blockLag <= 5`.

---

## 3. Resolving "Stuck" Transactions

### Symptoms
- User reports transaction in `PENDING` or `CONFIRMING` for an unusually long period (> 5 minutes).
- Polygon network gas spike causes transaction to be underpriced in the mempool.

### Investigation Steps
1. **Check Transaction Details via API**:
   ```bash
   curl http://localhost:3001/api/tx/<INTENT_ID>
   ```
   Inspect fields: `status`, `confirmations`, `requiredConfirmations`, `txHash`, `nonce`.

2. **Verify on Polygonscan**:
   Open `https://polygonscan.com/tx/<TX_HASH>`.
   - **Mined**: Note block number and number of confirmations. The background worker checks every 4 seconds and will advance status once `requiredConfirmations` are reached.
   - **Pending in Mempool**: The transaction is waiting for a miner due to a gas spike.
   - **Dropped/Not Found**: The transaction may have been dropped from the mempool or superseded by another transaction with the same nonce.

3. **Automatic Mempool Replacement Detection**:
   The `TxManager` automatically queries the wallet's on-chain `getTransactionCount('latest')`. If the on-chain nonce is greater than the transaction's nonce and the receipt is null, `TxManager` automatically marks the record as `DROPPED` or `REPLACED`.

4. **Manual Intervention (If Necessary)**:
   If a client wishes to retry an unmined transaction:
   - Provide the client with their `nonce` from `/api/tx/<INTENT_ID>`.
   - The user can issue a speed-up transaction via MetaMask/Rainbow with higher gas fees and the same nonce.
   - The backend worker will detect the replacement hash and update the record.

---

## 4. Replaying the Event Indexer from a Specific Block Cursor

If the backend was offline for extended maintenance or an unexpected chain reorg occurred beyond the default 10-block rewind window:

### Step 1: Inspect Current Indexer Cursor
Query the current indexer state:
```bash
curl http://localhost:3001/api/reconciliation/report
```

### Step 2: Reset the Cursor
In `polylance_shared_state.json`:
Locate the `indexerCursor` key:
```json
{
  "indexerCursor": {
    "lastBlockNumber": 68000000,
    "lastBlockHash": "0x...",
    "updatedAt": 1740000000000
  }
}
```
Set `lastBlockNumber` to the starting block from which you wish to replay logs (e.g., 5,000 blocks back).

### Step 3: Restart Backend Service
Restart the backend service. Upon boot, `EventIndexer.ts` will:
- Read the restored cursor block number.
- Batch queries in chunks of 500 blocks (`fromBlock` to `toBlock`).
- Parse and idempotently process all events without duplicating existing transactions (`processedLogs` deduplication key: `txHash:logIndex`).

---

## 5. Running On-Demand State Reconciliation

To verify that all off-chain server state matches on-chain escrow contracts:

1. **Trigger Reconciliation Report**:
   ```bash
   curl http://localhost:3001/api/reconciliation/report
   ```
2. **Review Output**:
   ```json
   {
     "timestamp": 1740000000000,
     "analyzedJobsCount": 42,
     "mismatchesCount": 0,
     "mismatches": []
   }
   ```
3. **If Mismatches are Reported**:
   Each entry lists:
   - `jobId`: The identifier of the job.
   - `serverStatus`: Status in server database.
   - `onChainStatus`: Status in the smart contract escrow.
   - `suggestedAction`: e.g. `UPDATE_SERVER_STATUS_TO_FUNDED` or `FLAG_ESCROW_INCONSISTENCY`.

---

## 6. Rate Limiting Configurations & Troubleshooting

PolyLance implements a tiered rate limiting policy:
- **Read Endpoints (`/api/sync`, `/api/notifications`, `/api/account/balances`, `/api/tx/*`, `/api/health/*`)**:
  - Ceiling: **300 requests per minute** per IP.
  - Handled by `httpReadLimiter`.
- **State Mutation Endpoints (`POST`, `PUT`, `DELETE`)**:
  - Ceiling: **60 requests per minute** per IP / wallet.
  - Handled by `httpLimiter`.

### Diagnosing HTTP 429
If clients report 429 errors:
1. Verify whether client is making raw un-deduplicated requests or polling without backoff.
2. Ensure frontend is utilizing `sharedPoller.fetchDeduplicated` for balance queries.
3. Check reverse proxy / cloud load balancer IP forwarding headers (`x-forwarded-for`).
