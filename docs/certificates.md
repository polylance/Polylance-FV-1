# PolyLance Verified Work Certificate (Soulbound ERC-5192)

## 1. Overview & Architecture

PolyLance Verified Work Certificates are non-transferable, soulbound reputation tokens issued to freelancers and patrons upon successful completion of milestone escrows on Polygon. They serve as cryptographic, tamper-proof proof of work that freelancers can showcase in their Web3 wallets (MetaMask, Coinbase Wallet, Rainbow, Zerion), on their public PolyLance profile, or embed in decentralized portfolios.

```
+-----------------------------------------------------------------------------------+
|                            PolyLance Smart Contract Flow                          |
|                                                                                   |
|  +------------------+         releasePayment()        +------------------------+  |
|  |   JobEscrow.sol  |  ============================>  |  ReputationSBT_v2.sol  |  |
|  +------------------+                                 +------------------------+  |
|                                                                    |              |
|                                     +------------------------------+              |
|                                     | ERC-5192 Minimal Soulbound                  |
|                                     | locked(tokenId) == true                     |
|                                     | emit Locked(tokenId)                        |
|                                     v                                             |
|                        +--------------------------+                               |
|                        |   Freelancer / Patron    |                               |
|                        |      Soulbound Token     |                               |
|                        +--------------------------+                               |
+-----------------------------------------------------------------------------------+
                                      |
                                      | tokenURI(tokenId)
                                      v
+-----------------------------------------------------------------------------------+
|                        PolyLance Metadata & Image Service                         |
|                                                                                   |
|  +--------------------------------------------+    +---------------------------+  |
|  |  GET /api/certificate/metadata/:tokenId    |    | GET /api/certificate/     |  |
|  |  (ERC-721 Schema + OpenSea display traits) |    |     image/:tokenId.svg    |  |
|  +--------------------------------------------+    +---------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Token Standard Specifications

### 2.1 ERC-5192: Minimal Soulbound NFTs
- **Interface Identifier**: `0xb45a3c0e` (`bytes4(keccak256("locked(uint256)"))`)
- **Soulbound Guarantee**: `locked(uint256 tokenId)` unconditionally returns `true` for all valid tokens.
- **Lock Event**: Upon minting, the contract emits `event Locked(uint256 tokenId)`.
- **Transfer Restrictions**: Standard ERC-721 transfer methods (`transferFrom`, `safeTransferFrom`, `approve`, `setApprovalForAll`) revert with custom error `TokenIsSoulbound()`.

### 2.2 EIP-4906: Metadata Update Events
- **Interface Identifier**: `0x49064906`
- **Cache Refresh Protocol**: Allows marketplaces and wallet indexers (OpenSea, MetaMask, Zerion) to invalidate cached token data when metadata updates occur:
  - `event MetadataUpdate(uint256 _tokenId);`
  - `event BatchMetadataUpdate(uint256 _fromTokenId, uint256 _toTokenId);`
- **Base URI Administration**: Owner can update the base metadata endpoint using `setBaseURI(string newBaseURI)` which automatically triggers `BatchMetadataUpdate(1, type(uint256).max)`.

### 2.3 Anti-Double-Mint Protection
- Each job has a deterministic identity preventing re-minting for the same milestone:
  - `hasMintedForJob(uint256 jobId, address recipient) -> bool`
  - Prevents race conditions, duplicate escrow payouts, or accidental multiple token claims.

---

## 3. Certificate Artwork Design System

### 3.1 Dimensions & Color Palette
- **Canvas Size**: 1000 x 1000 square (`viewBox="0 0 1000 1000"`).
- **Background**: `#FAFAF8` (warm off-white, anti-glare).
- **Primary Borders & Ink**: `#0B0B0F` (deep obsidian black).
- **Brand Accent**: `#0047AB` (PolyLance cobalt blue).
- **Secondary Accent**: `#7B3FE4` (Polygon official purple for ecosystem mark).

### 3.2 Visual Security & Aesthetics
1. **Guilloche Security Pattern**: A deterministic concentric geometric pattern mathematically generated from `keccak256(tokenId)` at 6% opacity, preventing visual counterfeiting.
2. **Double Border & Corner Rosettes**: A 3px outer `#0B0B0F` border and 1.5px inner `#0047AB` border with geometric rosette flourishes in each corner.
3. **Official PolyLance Seal**:
   - Circular seal stamped at `(x: 230, y: 790)` with radius `r="85"`.
   - Circular text ring curving along SVG `<textPath>`:
     `VERIFIED WORK CERTIFICATE • POLYLANCE • POLYGON`
   - Inner hexagon crest emblem in cobalt blue (`#0047AB`).
4. **Official Polygon Mark**: 3D geometric prism in Polygon purple `#7B3FE4`.
5. **Universal Wallet Typography**: Uses a system font stack (`system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`) to ensure flawless rendering inside wallet WebViews where external Google Fonts and scripts are blocked.

### 3.3 Proof of Work vs. Patronage Variants
- **Proof of Work (`variant="work"`)**: Awarded to the developer who delivered the code. Displays "PROOF OF WORK CERTIFICATE", recipient address, job title, and settlement payout.
- **Patronage (`variant="patronage"`)**: Awarded to the client who funded the escrow. Displays "ESCROW PATRONAGE CERTIFICATE", client address, job title, and total volume supported.

---

## 4. Metadata Service & Endpoints

### 4.1 Endpoints
The backend metadata service is served with CORS (`*`) and proper HTTP caching:

| Endpoint | Description | Cache-Control |
| :--- | :--- | :--- |
| `GET /api/certificate/metadata/:tokenId` | Full ERC-721 JSON metadata | `public, max-age=3600, s-maxage=86400` |
| `GET /api/certificate/image/:tokenId.svg` | Standalone 1000x1000 SVG master | `public, max-age=86400` |
| `GET /metadata/:tokenId` | BaseURI compatibility alias | `public, max-age=3600` |

### 4.2 Standard ERC-721 Metadata Schema
```json
{
  "name": "PolyLance Verified Work Certificate #7108",
  "description": "Cryptographically verified proof-of-work certificate minted upon milestone completion and fund release on Polygon. Soulbound and non-transferable under ERC-5192.",
  "image": "https://api.polylance.io/api/certificate/image/7108.svg",
  "external_url": "https://polylance.io/#/certificate/7108",
  "attributes": [
    { "trait_type": "Standard", "value": "ERC-5192 (Soulbound)" },
    { "trait_type": "Network", "value": "Polygon" },
    { "trait_type": "Token Type", "value": "Proof of Work" },
    { "trait_type": "Job Title", "value": "DeFi Aggregator Integration" },
    { "trait_type": "Settlement Amount", "value": 500, "display_type": "number" },
    { "trait_type": "Currency", "value": "USDC" },
    { "trait_type": "Completed Date", "value": 1791100000, "display_type": "date" },
    { "trait_type": "Locked", "value": "True" }
  ]
}
```

---

## 5. Adding Certificate to Web3 Wallets

### 5.1 One-Click Import (`wallet_watchAsset`)
The frontend includes an automated "Add to wallet" button that invokes the standard EIP-747 / ERC-721 wallet watch method:
```typescript
await window.ethereum.request({
  method: 'wallet_watchAsset',
  params: {
    type: 'ERC721',
    options: {
      address: CONTRACTS.ReputationSBT,
      tokenId: String(tokenId),
    },
  },
});
```

### 5.2 Manual Wallet Import Instructions

#### In MetaMask (Mobile & Browser Extension)
1. Open MetaMask and switch network to **Polygon Amoy Testnet** (or Polygon Mainnet in production).
2. Click the **NFTs** tab.
3. Scroll to the bottom and click **Import NFT**.
4. Enter the contract address:
   - `0x199175402482312d8a57A2771B66fD300F2997eA` (Amoy Testnet `ReputationSBT_v2`)
5. Enter your **Token ID** (e.g. `7108`).
6. Click **Import**. Your PolyLance seal and certificate artwork will display immediately.

#### In Coinbase Wallet
1. Open Coinbase Wallet and navigate to **Assets -> NFTs**.
2. Tap the settings gear or **Receive / Add Collectible**.
3. Select Polygon network and paste the contract address + Token ID.

#### In Rainbow Wallet
1. Rainbow automatically detects ERC-721/5192 tokens on Polygon.
2. If unindexed, search or add the custom contract address under **Settings -> Developer -> Watch Address**.

---

## 6. Pre-Production Mainnet Checklist

Before deploying `ReputationSBT_v2` to Polygon Mainnet (`chainId: 137`), verify the following critical security items:

- [ ] **Third-Party Security Audit**: Perform independent review on `ReputationSBT_v2.sol` ensuring transfer locks cannot be bypassed via reentrancy or delegatecall.
- [ ] **Gas Estimation**: Verify mint cost is under 90,000 gas (~$0.002 at 30 gwei on Polygon).
- [ ] **IPFS Pinning / Decentralized Storage**:
  - Configure automated pinning via Filecoin / Pinata / Web3.Storage for immutable certificate backup.
  - Set `baseURI` pointing to the canonical IPFS gateway or decentralized API.
- [ ] **Multi-Sig Admin Ownership**:
  - Transfer contract ownership from the deployment address to a Gnosis Safe multi-sig treasury wallet (`Polygon Safe`).
- [ ] **Metadata Service High Availability**:
  - Deploy metadata server with Cloudflare CDN or AWS CloudFront caching enabled to prevent downtime during traffic spikes.
  - Enforce rate-limiting on uncached requests.
- [ ] **Zero Mainnet Secrets**:
  - Ensure private keys and deployment seeds are stored exclusively in hardware security modules (HSM) or secure key vaults, never in plaintext `.env` files.
