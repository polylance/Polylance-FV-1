# Claims to Verify (Section 7 Audit)

The following claims and copy items across the platform must be reviewed by the product owner/legal team. As per design instructions, these strings are preserved or restyled rather than rewritten without verification:

| ID | Category | Current Text / Copy | Location | Notes / Reason |
| :--- | :--- | :--- | :--- | :--- |
| C-01 | **Fees** | "0% platform fee on beta" vs "Protocol fee rate 0.0%" vs "2.5% platform fee" | `Terms.tsx`, `Settings.tsx` (Admin), `LandingVisitor.tsx` | Platform fee is displayed as 2.5% in most places but Terms and Admin occasionally state 0%. Displayed values must bind to the shared fee configuration. |
| C-02 | **Privacy** | "PII collected: 0 bytes", "0 days retention (non-custodial)", "no analytics" | `Privacy.tsx`, `Security.tsx` | Off-chain database and Telegram linking retain user profile and alert records. Needs legal wording verification. |
| C-03 | **Zero-Knowledge** | "Zero-Knowledge Privacy Preservation", "financial contracts permanently shielded" | `Privacy.tsx`, `Security.tsx` | Polygon transactions, escrow amounts, and public certificates are visible on-chain. |
| C-04 | **Decentralization** | "No centralized entity or team member holds custody at any point", "no central administrator" | `Security.tsx`, `Manifesto.tsx` | Protocol includes an admin multisig, Oracle attestation, and fallback admin interventions when DAO quorum fails. |
| C-05 | **Legal Compliance** | "In full compliance with GDPR Article 17" | `Privacy.tsx` | On-chain immutability vs right-to-be-forgotten requires precise legal disclaimer. |
| C-06 | **Audits** | "Security Audit Rating 100% Passed", "Slither Audited" | `AuditReport.tsx`, `Security.tsx` | Automated static analysis (Slither) is not a comprehensive third-party audit firm sign-off. |
| C-07 | **Developer Endpoint** | `curl -X GET "https://api.polylance.codes/v1/verify/..."` | `CertifiedPass.tsx` | Ensure endpoint is live or clearly labeled as sample/mock documentation. |
| C-08 | **Guarantees** | "100% payment certainty", "cannot be pulled back arbitrarily", "guaranteed" | `Terms.tsx`, `Help.tsx` | Must clarify that outcomes are subject to dispute resolution and smart contract execution. |
| C-09 | **Sample Data** | "4.95 / 5.0 rating", "Certificate #3821", "3 of 3 consensus" | Demo mode, Public views | Ensure all synthetic/demo figures carry a subtle "Sample" badge. |
| C-10 | **Data Discrepancies** | 7 certificates in Dashboard vs 6 in Attestations; 18 completed projects vs 19 in stats | `Dashboard.tsx`, `Attestations` | Metrics should resolve from a single canonical data selector. |
