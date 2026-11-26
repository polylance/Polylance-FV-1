# PolyLance Architectural Specification & Execution Plan
**Categories, Onboarding, Internationalization (i18n), Creators Directory, Community & India Tax Explainer**

*Document Path: `docs/PLAN-categories-onboarding-i18n-community.md`*  
*Date: 2026-11-02*  
*Status: Pending User Review & Approval (NO CODE MODIFIED)*

---

## 1. Inspection Report

### 1.1 Wallet-Connect, Registration Flow & Profile Storage
- **Current Connection**: Powered by `wagmi` and `@rainbow-me/rainbowkit` in [`Web3Context.tsx`](file:///c:/Movies/Polylance/polylance/frontend/src/context/Web3Context.tsx), supporting injected wallets (MetaMask, Rabby, Coinbase Wallet) on Polygon Mainnet (`chainId: 137`) with fallback to Polygon Amoy (`chainId: 80002`).
- **Profile & Role Storage**:
  - **Off-Chain Backend**: User profiles and roles (`freelancer`, `client`, `judge`, `admin`) are stored strictly off-chain in the PostgreSQL database (`ProfileRecord` table) and mirrored in [`polylance_shared_state.json`](file:///c:/Movies/Polylance/polylance/polylance-chat-service/polylance_shared_state.json).
  - **No On-Chain Registry Contract**: Smart contracts (`JobFactory.sol`, `JobEscrow.sol`, `ReputationSBT_v2.sol`) do *not* maintain a user profile registry. There is no `registerUser()` contract function. Contract roles (`client`, `freelancer`, `arbitrator`) are determined per-job inside each isolated clone's bytecode state (`job.client`, `job.freelancer`).
- **"Registered Profiles" Metric**:
  - In [`publicStats.ts`](file:///c:/Movies/Polylance/polylance/polylance-chat-service/src/publicStats.ts#L248):
    ```typescript
    const registeredProfilesCount = Object.keys(sharedState.profiles || {}).length;
    ```
    The count represents unique wallet addresses that have saved a profile object in `sharedState.profiles` (persisted in Postgres `ProfileRecord`).

### 1.2 System Topology, Models & Stack
- **Frontend Stack**: Vite 8.3, React 19, TypeScript, Tailwind CSS v4, Lucide icons, Framer Motion, Wagmi / Viem / Ethers v6.
- **Backend Stack**:
  - **Runtime**: Node.js with TypeScript (`tsx` / `tsc`).
  - **Framework**: Express.js with WebSocket server for encrypted chat.
  - **Database**: PostgreSQL.
  - **ORM**: Prisma (`polylance-chat-service/prisma/schema.prisma`).
  - **Auth**: SIWE (Sign-In with Ethereum, EIP-4361) via `@polylance/auth` / session token, ECDSA signature recovery, zero storage of passwords, emails, or phone numbers.
  - **Hosting**: Vercel for frontend; Node.js container / VPS for API & WebSocket service.
- **Existing Routes & Navigation**:
  - Navbar: Marketplace (`/jobs`), Escrow (`/escrow`), CertifiedPass (`/certifiedpass`), Blog (`/blog`), Simulator (`/escrow-simulator`), AuditX (`/auditx`).
  - Footer: Multi-column links to Legal, Resources, Fee Schedule (`/fees`), Audit Status (`/audit-report`), Disclaimer (`/disclaimer`). Bottom line strictly `"PolyLance Protocol"`.
  - How it Works: [`/how-it-works`](file:///c:/Movies/Polylance/polylance/frontend/src/pages/HowItWorksPage.tsx) explaining milestone escrow, 4-step sequence, and dispute resolution.
- **Current Category & Skill Modeling**:
  - `SkillCategory` is currently hardcoded in [`types.ts`](file:///c:/Movies/Polylance/polylance/frontend/src/types.ts#L8) as an enum: `'web3' | 'frontend' | 'backend' | 'mobile'`.
  - `skillsRequired` is an unconstrained `string[]`.
- **Existing i18n**: None currently installed (`package.json` contains no i18n libraries). All strings are currently hardcoded English in JSX files.

### 1.3 Earnings & Completed-Project Data (On-Chain vs DB)
- **Completed Project Tracking**:
  - **Database**: `JobRecord` in Prisma has `status: 'Completed'` with `onchainTokenId`, `certificateNo`, `mintTxHash`, and `completedAt`.
  - **On-Chain Verification (100% Immutable)**:
    1. **Escrow Proxy State**: Calling `currentState()` on any `JobEscrow` proxy clone contract returns `State.Complete` (`3`) or `State.Resolved` (`5`).
    2. **Event Emission**: `JobEscrow` emits `PaymentReleased(uint256 milestoneIndex, uint256 amount, uint256 fee)` upon client sign-off.
    3. **ERC-5192 Soulbound Token**: `ReputationSBT_v2.sol` (`0x22A61f83cEB94233d30a20EEacBdEB9BCC1C2879`) mints an immutable token to the freelancer's wallet upon completion, providing verifiable on-chain proof of work.
- **Earnings Verification**:
  - Freelancer earnings can be verified by filtering `PaymentReleased` event logs on Polygon Mainnet for the specific job clone contracts where `job.freelancer == userAddress`.

---

## 2. Taxonomy Seed (JSON Data-Driven Architecture)

The taxonomy is defined as a standalone JSON asset (`frontend/src/data/taxonomy.json` and `polylance-chat-service/src/data/taxonomy.json`). Components will **never** hardcode category names; all names use translation keys with English fallbacks.

```json
{
  "version": "1.0.0",
  "categories": [
    {
      "id": "cat_dev_it",
      "slug": "development-it",
      "nameKey": "tax.cat.dev_it.name",
      "defaultName": "Development & IT",
      "descriptionKey": "tax.cat.dev_it.desc",
      "defaultDescription": "Full-stack software engineering, infrastructure, architecture, and cloud systems.",
      "themeColor": "cobalt",
      "subcategories": [
        {
          "id": "sub_web_dev",
          "slug": "web-development",
          "nameKey": "tax.sub.web_dev.name",
          "defaultName": "Web Development",
          "skills": [
            "React", "TypeScript", "Next.js", "Node.js", "Vue.js", "Tailwind CSS",
            "GraphQL", "REST APIs", "PostgreSQL", "HTML5/CSS3", "WebSockets", "Vite"
          ]
        },
        {
          "id": "sub_mobile_dev",
          "slug": "mobile-development",
          "nameKey": "tax.sub.mobile_dev.name",
          "defaultName": "Mobile Apps",
          "skills": [
            "React Native", "Flutter", "Swift", "Kotlin", "iOS SDK", "Android Jetpack",
            "Expo", "App Store Submission", "Play Store Publishing", "Mobile SQLite"
          ]
        },
        {
          "id": "sub_software_apis",
          "slug": "software-apis",
          "nameKey": "tax.sub.software_apis.name",
          "defaultName": "Software Architecture & APIs",
          "skills": [
            "Go", "Rust", "Python", "Microservices", "gRPC", "Docker",
            "API Gateway", "OAuth 2.0", "OpenAPI/Swagger", "Event-Driven Architecture", "Kafka"
          ]
        },
        {
          "id": "sub_devops_cloud",
          "slug": "devops-cloud",
          "nameKey": "tax.sub.devops_cloud.name",
          "defaultName": "DevOps & Cloud",
          "skills": [
            "AWS", "GCP", "Kubernetes", "Terraform", "CI/CD Pipelines", "GitHub Actions",
            "Cloudflare", "Linux Administration", "Prometheus/Grafana", "Serverless"
          ]
        },
        {
          "id": "sub_qa_testing",
          "slug": "qa-testing",
          "nameKey": "tax.sub.qa_testing.name",
          "defaultName": "QA & Automated Testing",
          "skills": [
            "Playwright", "Cypress", "Jest", "Vitest", "Selenium", "E2E Testing",
            "Performance Testing", "Load Testing", "API Testing", "Bug Reporting"
          ]
        },
        {
          "id": "sub_it_support",
          "slug": "it-support",
          "nameKey": "tax.sub.it_support.name",
          "defaultName": "IT Systems & Support",
          "skills": [
            "System Administration", "Network Configuration", "VPN Setup", "DNS Management",
            "Helpdesk Support", "Hardware Diagnosis", "Active Directory", "Data Backup"
          ]
        },
        {
          "id": "sub_cybersecurity",
          "slug": "cybersecurity",
          "nameKey": "tax.sub.cybersecurity.name",
          "defaultName": "Cybersecurity & InfoSec",
          "skills": [
            "Penetration Testing", "Vulnerability Assessment", "OWASP Standards", "Zero Trust",
            "SOC 2 Compliance", "Cryptography", "Identity & Access Management", "Incident Response"
          ]
        }
      ]
    },
    {
      "id": "cat_ai_auto",
      "slug": "ai-automation",
      "nameKey": "tax.cat.ai_auto.name",
      "defaultName": "AI & Automation",
      "descriptionKey": "tax.cat.ai_auto.desc",
      "defaultDescription": "Machine learning, agentic workflows, autonomous systems, and model integration.",
      "themeColor": "orange",
      "subcategories": [
        {
          "id": "sub_ai_ml_eng",
          "slug": "ai-ml-engineering",
          "nameKey": "tax.sub.ai_ml_eng.name",
          "defaultName": "AI/ML Engineering",
          "skills": [
            "PyTorch", "TensorFlow", "Hugging Face", "Fine-Tuning", "LoRA", "RAG Pipelines",
            "Vector Databases (Pinecone/Qdrant)", "LangChain", "LlamaIndex", "Model Quantization"
          ]
        },
        {
          "id": "sub_chatbots_agents",
          "slug": "chatbots-agents",
          "nameKey": "tax.sub.chatbots_agents.name",
          "defaultName": "Autonomous Agents & Chatbots",
          "skills": [
            "Gemini API", "OpenAI Assistants", "Anthropic Claude SDK", "Function Calling",
            "Multi-Agent Systems", "AutoGPT", "CrewAI", "Voice Agents", "Context Management"
          ]
        },
        {
          "id": "sub_prompt_workflow",
          "slug": "prompt-workflow",
          "nameKey": "tax.sub.prompt_workflow.name",
          "defaultName": "Prompt Engineering & Workflow Design",
          "skills": [
            "Structured Outputs", "Few-Shot Prompting", "Chain-of-Thought", "Evaluation Frameworks",
            "LLM Benchmarking", "Synthetic Data Generation", "System Prompt Architecture"
          ]
        },
        {
          "id": "sub_nocode_auto",
          "slug": "nocode-automation",
          "nameKey": "tax.sub.nocode_auto.name",
          "defaultName": "No-Code & Low-Code Automation",
          "skills": [
            "n8n", "Make.com", "Zapier", "Airtable Automation", "Webhook Integrations",
            "Appsmith", "Retool", "Automated Workflows"
          ]
        },
        {
          "id": "sub_computer_vision",
          "slug": "computer-vision",
          "nameKey": "tax.sub.computer_vision.name",
          "defaultName": "Computer Vision & OCR",
          "skills": [
            "OpenCV", "YOLOv8", "Image Segmentation", "OCR", "Object Detection",
            "Video Stream Analysis", "Face Recognition", "Multimodal Transformers"
          ]
        },
        {
          "id": "sub_data_labeling",
          "slug": "data-labeling",
          "nameKey": "tax.sub.data_labeling.name",
          "defaultName": "Data Labeling & Annotation",
          "skills": [
            "RLHF Human Feedback", "Dataset Curation", "Bounding Box Annotation",
            "NER Tagging", "Quality Assurance", "Taxonomy Categorization"
          ]
        }
      ]
    },
    {
      "id": "cat_web3_block",
      "slug": "web3-blockchain",
      "nameKey": "tax.cat.web3_block.name",
      "defaultName": "Web3 & Blockchain",
      "descriptionKey": "tax.cat.web3_block.desc",
      "defaultDescription": "Smart contract engineering, protocol auditing, decentralized frontends, and crypto systems.",
      "themeColor": "cobalt",
      "subcategories": [
        {
          "id": "sub_smart_contracts",
          "slug": "smart-contracts",
          "nameKey": "tax.sub.smart_contracts.name",
          "defaultName": "Smart Contract Development",
          "skills": [
            "Solidity", "Hardhat", "Foundry", "Polygon PoS", "EIP-1167 Proxies", "ERC-20",
            "ERC-721", "ERC-5192 Soulbound", "OpenZeppelin", "Gas Optimization", "Vyper"
          ]
        },
        {
          "id": "sub_security_review",
          "slug": "security-review",
          "nameKey": "tax.sub.security_review.name",
          "defaultName": "Security Auditing & Hardening",
          "skills": [
            "Slither", "Mythril", "Reentrancy Analysis", "Static Analysis", "Bytecode Decompilation",
            "Invariable Testing", "Echidna", "Economic Exploit Modeling", "Formal Verification"
          ]
        },
        {
          "id": "sub_dapp_frontend",
          "slug": "dapp-frontend",
          "nameKey": "tax.sub.dapp_frontend.name",
          "defaultName": "dApp Frontend Integration",
          "skills": [
            "Wagmi", "Viem", "Ethers.js", "RainbowKit", "SIWE", "WalletConnect",
            "IPFS/Pinata", "The Graph / Subgraphs", "Event Indexing", "Transaction Simulation"
          ]
        },
        {
          "id": "sub_tokenomics",
          "slug": "tokenomics-research",
          "nameKey": "tax.sub.tokenomics.name",
          "defaultName": "Tokenomics & Protocol Research",
          "skills": [
            "Token Economics", "Vesting Schedule Design", "Liquidity Mechanics", "Staking Logic",
            "Governance Structures", "Whitepaper Writing", "Market Making Theory"
          ]
        },
        {
          "id": "sub_community_mgmt",
          "slug": "web3-community",
          "nameKey": "tax.sub.community_mgmt.name",
          "defaultName": "Community & Ecosystem Growth",
          "skills": [
            "Discord Architecture", "Telegram Moderation", "DAO Governance Coordination",
            "Ambassador Programs", "Collab Land / Guild.xyz", "Community Safety"
          ]
        },
        {
          "id": "sub_web3_marketing",
          "slug": "web3-marketing",
          "nameKey": "tax.sub.web3_marketing.name",
          "defaultName": "Web3 Marketing & PR",
          "skills": [
            "KOL Campaigns", "Twitter Spaces", "DeFi Llama Listings", "CoinMarketCap/CoinGecko Verification",
            "Airdrop Campaign Design", "Crypto PR Releases"
          ]
        }
      ]
    },
    {
      "id": "cat_design_creat",
      "slug": "design-creative",
      "nameKey": "tax.cat.design_creat.name",
      "defaultName": "Design & Creative",
      "descriptionKey": "tax.cat.design_creat.desc",
      "defaultDescription": "Human-centered digital interfaces, brand identity, illustration, and product design.",
      "themeColor": "yellow",
      "subcategories": [
        {
          "id": "sub_ui_ux",
          "slug": "ui-ux-design",
          "nameKey": "tax.sub.ui_ux.name",
          "defaultName": "UI/UX & Product Design",
          "skills": [
            "Figma", "Design Systems", "Wireframing", "Mobile UI", "Web UI", "Prototyping",
            "User Research", "Usability Testing", "Information Architecture", "WCAG Accessibility"
          ]
        },
        {
          "id": "sub_brand_identity",
          "slug": "brand-identity",
          "nameKey": "tax.sub.brand_identity.name",
          "defaultName": "Brand Identity & Logo Design",
          "skills": [
            "Brand Guidelines", "Logo Creation", "Typography Selection", "Color Theory",
            "Iconography", "Vector Illustration", "Adobe Illustrator"
          ]
        },
        {
          "id": "sub_illustration",
          "slug": "illustration",
          "nameKey": "tax.sub.illustration.name",
          "defaultName": "Digital Illustration",
          "skills": [
            "Custom Vector Art", "Character Design", "Concept Art", "Editorial Illustration",
            "Procreate", "Storyboarding", "NFT Artwork"
          ]
        },
        {
          "id": "sub_packaging",
          "slug": "packaging-print",
          "nameKey": "tax.sub.packaging.name",
          "defaultName": "Packaging & Print Design",
          "skills": [
            "Product Packaging", "Die-Cut Templates", "Label Design", "Print Preparation (CMYK)",
            "Merchandise Design", "Brochures & Catalogs"
          ]
        },
        {
          "id": "sub_3d_cad",
          "slug": "3d-cad",
          "nameKey": "tax.sub.3d_cad.name",
          "defaultName": "3D Modeling & CAD",
          "skills": [
            "Blender", "Cinema 4D", "3D Product Rendering", "Character Modeling",
            "Spline 3D", "CAD Modeling", "Texturing & Lighting", "glTF / WebGL Assets"
          ]
        },
        {
          "id": "sub_presentation",
          "slug": "presentation-design",
          "nameKey": "tax.sub.presentation.name",
          "defaultName": "Pitch Decks & Presentations",
          "skills": [
            "Investor Pitch Decks", "Keynote", "Pitch.com", "Sales Collateral",
            "Data Visualization", "Infographics", "Executive Decks"
          ]
        }
      ]
    },
    {
      "id": "cat_video_audio",
      "slug": "video-audio-animation",
      "nameKey": "tax.cat.video_audio.name",
      "defaultName": "Video, Audio & Animation",
      "descriptionKey": "tax.cat.video_audio.desc",
      "defaultDescription": "Cinematic editing, motion graphics, original sound composition, and audio mastering.",
      "themeColor": "red",
      "subcategories": [
        {
          "id": "sub_video_editing",
          "slug": "video-editing",
          "nameKey": "tax.sub.video_editing.name",
          "defaultName": "Video Editing & Post-Production",
          "skills": [
            "Adobe Premiere Pro", "DaVinci Resolve", "Color Grading", "Multi-Cam Editing",
            "Audio Syncing", "Sound Design", "Pacing & Narrative"
          ]
        },
        {
          "id": "sub_motion_graphics",
          "slug": "motion-graphics",
          "nameKey": "tax.sub.motion_graphics.name",
          "defaultName": "Motion Graphics & 2D Animation",
          "skills": [
            "After Effects", "Lottie Animations", "Title Sequences", "Explainer Videos",
            "Kinetic Typography", "Logo Reveals", "UI Micro-Animations"
          ]
        },
        {
          "id": "sub_voiceover",
          "slug": "voice-over",
          "nameKey": "tax.sub.voiceover.name",
          "defaultName": "Voice-Over & Dubbing",
          "skills": [
            "Commercial Voice-Over", "Explainer Narration", "Character Voices", "Multi-Language Dubbing",
            "Audio Noise Reduction", "Professional Studio Recording"
          ]
        },
        {
          "id": "sub_music_sound",
          "slug": "music-sound",
          "nameKey": "tax.sub.music_sound.name",
          "defaultName": "Music Production & Sound Design",
          "skills": [
            "Ableton Live", "Logic Pro", "Original Soundtrack", "Audio Mixing & Mastering",
            "Foley Sound Effects", "Podcast Jingle", "Sonic Branding"
          ]
        },
        {
          "id": "sub_podcast_prod",
          "slug": "podcast-production",
          "nameKey": "tax.sub.podcast_prod.name",
          "defaultName": "Podcast Production",
          "skills": [
            "Audio Cleanup", "Descript", "Show Notes Drafting", "Podcast Audiograms",
            "Intro/Outro Mastering", "Episode Packaging"
          ]
        },
        {
          "id": "sub_shortform_video",
          "slug": "shortform-editing",
          "nameKey": "tax.sub.shortform_video.name",
          "defaultName": "Short-Form Video (Reels/TikTok/Shorts)",
          "skills": [
            "Retention Editing", "CapCut Pro", "Dynamic Subtitling", "Hook Optimization",
            "Sound Effects Timing", "B-Roll Insertion", "Viral Format Pacing"
          ]
        }
      ]
    },
    {
      "id": "cat_creators_collab",
      "slug": "creators-brand-collabs",
      "nameKey": "tax.cat.creators_collab.name",
      "defaultName": "Creators & Brand Collabs",
      "descriptionKey": "tax.cat.creators_collab.desc",
      "defaultDescription": "Sponsorships, content co-creation, audience activations, and authentic creator marketing.",
      "themeColor": "orange",
      "subcategories": [
        {
          "id": "sub_youtube_collabs",
          "slug": "youtube-sponsorships",
          "nameKey": "tax.sub.youtube_collabs.name",
          "defaultName": "YouTube Integrations & Reviews",
          "skills": [
            "Dedicated Video", "60s Mid-Roll Integration", "Tech Product Review", "Developer Tutorial",
            "Pinned Comment Promo", "End-Card Linkage", "Community Post Promotion"
          ]
        },
        {
          "id": "sub_instagram_reels",
          "slug": "instagram-reels",
          "nameKey": "tax.sub.instagram_reels.name",
          "defaultName": "Instagram & Reels Activations",
          "skills": [
            "Sponsored Reel", "Story Sequence with Links", "Carousel Post", "Collab Post Feature",
            "Brand Takeover", "Highlight Reel Feature"
          ]
        },
        {
          "id": "sub_short_video_creators",
          "slug": "tiktok-shorts",
          "nameKey": "tax.sub.short_video_creators.name",
          "defaultName": "TikTok & Shorts Creators",
          "skills": [
            "Viral Sound Integration", "Challenge Participation", "Organic Product Placement",
            "Green Screen Review", "Creator Marketplace Ad Authorization"
          ]
        },
        {
          "id": "sub_podcast_sponsors",
          "slug": "podcast-host-reads",
          "nameKey": "tax.sub.podcast_sponsors.name",
          "defaultName": "Podcast Host-Read Ads",
          "skills": [
            "Host-Read Pre-Roll", "Host-Read Mid-Roll", "Sponsored Guest Segment",
            "Custom Discount Code Promotion", "Newsletter Sponsorship Placement"
          ]
        },
        {
          "id": "sub_ugc_creators",
          "slug": "ugc-content",
          "nameKey": "tax.sub.ugc_creators.name",
          "defaultName": "UGC (User-Generated Content)",
          "skills": [
            "Unboxing Video", "Problem-Agitation-Solution Video", "Testimonial Ad",
            "App Walkthrough", "Direct-Response Creative", "Hook Variations"
          ]
        },
        {
          "id": "sub_livestreaming",
          "slug": "livestream-sponsorships",
          "nameKey": "tax.sub.livestreaming.name",
          "defaultName": "Livestreaming & Events",
          "skills": [
            "Twitch Stream Overlay", "Live Demo Session", "Chat Bot Link Promo",
            "Exclusive Tournament/Event Stream", "Live Q&A Sponsorship"
          ]
        },
        {
          "id": "sub_brand_ambassadors",
          "slug": "brand-ambassadors",
          "nameKey": "tax.sub.brand_ambassadors.name",
          "defaultName": "Brand Ambassadors & Key Opinions",
          "skills": [
            "Long-Term Ambassador Campaign", "Keynote Representation", "Social Bio Linkage",
            "Product Co-Development", "Ad Creative Whitelisting"
          ]
        }
      ]
    },
    {
      "id": "cat_marketing",
      "slug": "marketing",
      "nameKey": "tax.cat.marketing.name",
      "defaultName": "Marketing",
      "descriptionKey": "tax.cat.marketing.desc",
      "defaultDescription": "Search optimization, performance acquisition, lifecycle email, and organic growth.",
      "themeColor": "yellow",
      "subcategories": [
        {
          "id": "sub_seo",
          "slug": "seo",
          "nameKey": "tax.sub.seo.name",
          "defaultName": "Search Engine Optimization (SEO)",
          "skills": [
            "Technical SEO", "Keyword Research", "On-Page Optimization", "Backlink Strategy",
            "Schema Markup", "Core Web Vitals Optimization", "Programmatic SEO"
          ]
        },
        {
          "id": "sub_smm",
          "slug": "social-media-management",
          "nameKey": "tax.sub.smm.name",
          "defaultName": "Social Media Management",
          "skills": [
            "Content Calendar Execution", "X/Twitter Growth", "LinkedIn Personal Branding",
            "Community Engagement", "Social Copywriting", "Trend Jacking"
          ]
        },
        {
          "id": "sub_performance_ads",
          "slug": "performance-ads",
          "nameKey": "tax.sub.performance_ads.name",
          "defaultName": "Paid Advertising & Performance",
          "skills": [
            "Google Search Ads", "Meta Ads Manager", "LinkedIn Ads", "Twitter Ads",
            "Retargeting Campaigns", "Conversion Rate Optimization (CRO)", "ROAS Scaling"
          ]
        },
        {
          "id": "sub_email_marketing",
          "slug": "email-marketing",
          "nameKey": "tax.sub.email_marketing.name",
          "defaultName": "Email & Lifecycle Marketing",
          "skills": [
            "Klaviyo", "Mailchimp", "Drip Sequence Design", "Customer Segmentation",
            "Newsletter Writing", "Deliverability & Warmup", "Churn Prevention Flows"
          ]
        },
        {
          "id": "sub_brand_strategy",
          "slug": "brand-strategy",
          "nameKey": "tax.sub.brand_strategy.name",
          "defaultName": "Brand Strategy & Positioning",
          "skills": [
            "Competitor Auditing", "Value Proposition Design", "Messaging Hierarchy",
            "Go-To-Market Planning", "Customer Persona Research"
          ]
        },
        {
          "id": "sub_growth_affiliate",
          "slug": "affiliate-growth",
          "nameKey": "tax.sub.growth_affiliate.name",
          "defaultName": "Growth Hacking & Affiliates",
          "skills": [
            "Affiliate Program Architecture", "Viral Loop Modeling", "Product-Led Growth",
            "Referral System Design", "A/B Testing Experiments"
          ]
        }
      ]
    },
    {
      "id": "cat_writing_content",
      "slug": "writing-content",
      "nameKey": "tax.cat.writing_content.name",
      "defaultName": "Writing & Content",
      "descriptionKey": "tax.cat.writing_content.desc",
      "defaultDescription": "Technical prose, high-converting copy, translation, and long-form research.",
      "themeColor": "cobalt",
      "subcategories": [
        {
          "id": "sub_articles_blogs",
          "slug": "articles-blogs",
          "nameKey": "tax.sub.articles_blogs.name",
          "defaultName": "Articles & Long-Form Blogs",
          "skills": [
            "Thought Leadership", "SEO Content Writing", "Industry Research",
            "Case Studies", "Interviews", "Editing & Proofreading"
          ]
        },
        {
          "id": "sub_copywriting",
          "slug": "copywriting",
          "nameKey": "tax.sub.copywriting.name",
          "defaultName": "Direct-Response Copywriting",
          "skills": [
            "Landing Page Copy", "Sales Letters", "Ad Copy", "Email Sequence Copy",
            "Headline Hook Writing", "Value Proposition Crafting"
          ]
        },
        {
          "id": "sub_technical_writing",
          "slug": "technical-writing",
          "nameKey": "tax.sub.technical_writing.name",
          "defaultName": "Technical Documentation",
          "skills": [
            "Developer Docs", "API Reference Manuals", "Smart Contract Guides",
            "SDK Walkthroughs", "GitBook / Docusaurus", "Whitepaper Drafting"
          ]
        },
        {
          "id": "sub_translation_loc",
          "slug": "translation-localization",
          "nameKey": "tax.sub.translation_loc.name",
          "defaultName": "Translation & Localization",
          "skills": [
            "English to Hindi", "English to Spanish", "English to German", "English to Japanese",
            "English to Arabic", "Software UI Localization", "Cultural Adaptation"
          ]
        },
        {
          "id": "sub_editing_proofreading",
          "slug": "editing-proofreading",
          "nameKey": "tax.sub.editing_proofreading.name",
          "defaultName": "Editing & Proofreading",
          "skills": [
            "Grammar & Syntax Auditing", "Structural Editing", "Style Guide Compliance",
            "Academic Editing", "Manuscript Refinement"
          ]
        },
        {
          "id": "sub_scriptwriting",
          "slug": "scriptwriting",
          "nameKey": "tax.sub.scriptwriting.name",
          "defaultName": "Scriptwriting for Video & Audio",
          "skills": [
            "YouTube Video Scripts", "Short-Form Video Hooks", "Podcast Run of Show",
            "Commercial Ad Scripts", "Voiceover Timing"
          ]
        }
      ]
    },
    {
      "id": "cat_data_analytics",
      "slug": "data-analytics",
      "nameKey": "tax.cat.data_analytics.name",
      "defaultName": "Data & Analytics",
      "descriptionKey": "tax.cat.data_analytics.desc",
      "defaultDescription": "Business intelligence, analytics engineering, quantitative modeling, and data pipelines.",
      "themeColor": "cobalt",
      "subcategories": [
        {
          "id": "sub_data_analysis",
          "slug": "data-analysis",
          "nameKey": "tax.sub.data_analysis.name",
          "defaultName": "Data Analysis & Insights",
          "skills": [
            "SQL", "Python (Pandas/NumPy)", "Statistical Analysis", "Cohort Analysis",
            "A/B Test Evaluation", "Exploratory Data Analysis"
          ]
        },
        {
          "id": "sub_bi_dashboards",
          "slug": "bi-dashboards",
          "nameKey": "tax.sub.bi_dashboards.name",
          "defaultName": "BI Dashboards & Visualization",
          "skills": [
            "Tableau", "Power BI", "Looker Studio", "Metabase", "Executive KPIs",
            "Interactive Visualizations", "Dashboard Performance Optimization"
          ]
        },
        {
          "id": "sub_data_engineering",
          "slug": "data-engineering",
          "nameKey": "tax.sub.data_engineering.name",
          "defaultName": "Data Engineering & Pipelines",
          "skills": [
            "ETL/ELT Architecture", "dbt", "Snowflake", "BigQuery", "Apache Spark",
            "Airflow", "Data Modeling", "Schema Optimization"
          ]
        },
        {
          "id": "sub_data_science",
          "slug": "data-science",
          "nameKey": "tax.sub.data_science.name",
          "defaultName": "Data Science & Predictive Modeling",
          "skills": [
            "Scikit-Learn", "Regression Analysis", "Classification Models",
            "Time Series Forecasting", "Clustering", "Feature Engineering"
          ]
        },
        {
          "id": "sub_research_surveys",
          "slug": "research-surveys",
          "nameKey": "tax.sub.research_surveys.name",
          "defaultName": "Quantitative Research & Surveys",
          "skills": [
            "Survey Methodology", "Sample Bias Correction", "Qualtrics / Typeform",
            "Cross-Tabulation", "Hypothesis Testing"
          ]
        },
        {
          "id": "sub_spreadsheets",
          "slug": "advanced-spreadsheets",
          "nameKey": "tax.sub.spreadsheets.name",
          "defaultName": "Advanced Spreadsheets & Modeling",
          "skills": [
            "Google Sheets Advanced", "Excel Power Query", "VBA / Apps Script",
            "Financial Modeling", "Pivot Tables", "Dynamic Formula Stacks"
          ]
        }
      ]
    },
    {
      "id": "cat_admin_support",
      "slug": "admin-support",
      "nameKey": "tax.cat.admin_support.name",
      "defaultName": "Admin & Support",
      "descriptionKey": "tax.cat.admin_support.desc",
      "defaultDescription": "Virtual operations, executive assistance, customer support, and process coordination.",
      "themeColor": "red",
      "subcategories": [
        {
          "id": "sub_virtual_assistants",
          "slug": "virtual-assistants",
          "nameKey": "tax.sub.virtual_assistants.name",
          "defaultName": "Executive & Virtual Assistants",
          "skills": [
            "Calendar Management", "Executive Inbox Triage", "Travel Logistics",
            "Vendor Coordination", "Document Preparation", "Discretion & Confidentiality"
          ]
        },
        {
          "id": "sub_customer_support",
          "slug": "customer-support",
          "nameKey": "tax.sub.customer_support.name",
          "defaultName": "Customer Support & Success",
          "skills": [
            "Zendesk", "Intercom", "Freshdesk", "Live Chat Support", "Ticket Resolution",
            "SLA Management", "Customer Empathy", "Escalation Handling"
          ]
        },
        {
          "id": "sub_data_entry",
          "slug": "data-entry",
          "nameKey": "tax.sub.data_entry.name",
          "defaultName": "Data Entry & Web Research",
          "skills": [
            "CRM Data Cleaning", "Lead List Building", "Product Catalog Uploads",
            "Online Research", "Accurate Typing (70+ WPM)", "Data Validation"
          ]
        },
        {
          "id": "sub_project_mgmt",
          "slug": "project-management",
          "nameKey": "tax.sub.project_mgmt.name",
          "defaultName": "Project Management & Scrum",
          "skills": [
            "Jira", "Linear", "Asana", "Notion Systems", "Sprint Planning",
            "Agile/Scrum Framework", "Milestone Tracking", "Resource Allocation"
          ]
        },
        {
          "id": "sub_transcription",
          "slug": "transcription",
          "nameKey": "tax.sub.transcription.name",
          "defaultName": "Audio/Video Transcription",
          "skills": [
            "Verbatim Transcription", "Clean Read Editing", "Timestamping",
            "Medical/Legal Terminology", "SubRip (.srt) Formatting"
          ]
        }
      ]
    }
  ]
}
```

### Proposed Extra Subcategories for User Review
1. **Under Web3 & Blockchain**:
   - `sub_defi_protocols`: "DeFi Protocol Engineering" (AMMs, Lending Pools, Flashloans).
   - `sub_nft_infra`: "NFT & Gaming Smart Contracts" (ERC-1155, Dynamic Metadata, Royalty Contracts).
2. **Under Creators & Brand Collabs**:
   - `sub_newsletter_creators`: "Substack & Beehiiv Writers" (Dedicated email blasts, newsletter sponsorships).
3. **Under Development & IT**:
   - `sub_firmware_iot`: "Embedded Systems & Hardware Interfacing".

---

## 3. Category Field Modules (Dynamic Profile Schemas)

Each category defines an explicit module schema for profile requirements. Base fields are required for everyone; specialized fields are requested only when a user selects that category as their primary category.

```typescript
export interface BaseProfileFields {
  displayName: string;         // 2-50 chars, required
  avatarUrl?: string;          // IPFS or pre-approved storage, optional
  headline: string;            // Max 100 chars, required
  bio: string;                 // Max 1000 chars, required
  languages: Array<{           // At least 1 required
    code: string;              // ISO-639-1 ('en', 'hi', etc.)
    level: 'native' | 'fluent' | 'conversational';
  }>;
  hourlyRateUsdc?: number;     // Optional
  preferredToken: 'USDC' | 'POL'; // Required, default 'USDC'
  availability: 'full_time' | 'part_time' | 'not_available'; // Required
}
```

### Category-Specific Field Modules:

| Category | Specialized Fields | Why We Ask (User-Facing Microcopy) | Validation Rule |
| :--- | :--- | :--- | :--- |
| **Development & IT** | `githubUsername`<br>`techStack` (array)<br>`liveProjectUrls` (array) | "Demonstrates verified code contributions and deployed systems to prospective clients." | GitHub handle format regex;<br>Valid URL format; no auth token required. |
| **AI & Automation** | `githubUsername`<br>`deployedModelUrls` (array)<br>`frameworks` (array) | "Allows clients to test and review your deployed endpoints, agents, or public repos." | Valid URL format; regex check only. |
| **Web3 & Blockchain** | `githubUsername`<br>`contractAddressesVerified` (array)<br>`polygonscanProfiles` (array) | "Proves mainnet contract deployment history and verifiable on-chain bytecode." | Valid 0x address format (42 chars); regex only. |
| **Design & Creative** | `portfolioUrl` (Figma/Behance/Dribbble/Custom)<br>`designTools` (array) | "Gives clients immediate visual proof of your craft, design system, and product polish." | Valid URL regex matching allowed domains or secure https:// link. |
| **Video, Audio & Animation** | `showreelUrl` (YouTube/Vimeo/Loom)<br>`productionTools` (array) | "Allows clients to experience your pacing, color grading, sound design, and motion rhythm." | Valid YouTube, Vimeo, or video link regex. |
| **Creators & Brand Collabs** | `creatorPlatforms` (array):<br>- `platform`: `'youtube' \| 'instagram' \| 'tiktok' \| 'podcast'`<br>- `handleOrUrl`: string<br>- `audienceCount`: number (self-reported)<br>- `niche`: string<br>- `rateCard`: `{ deliverable: string; priceUsdc: number }[]`<br>- `mediaKitUrl`: optional string | "Empowers brands to review your reach, formats, and transparent rate cards before starting an escrow." | Formatted URL/handle;<br>Number $\ge 0$;<br>**Strictly labelled "Self-reported, not verified"**. |
| **Marketing** | `caseStudyUrls` (array)<br>`specialties` (array) | "Demonstrates organic rankings, ROAS scaling, or campaign revenue evidence." | Valid URL format. |
| **Writing & Content** | `writingSampleUrls` (array)<br>`languagePairs` (array of `{ from, to }`) | "Permits clients to inspect your prose clarity, structure, and translation fluency." | Valid URLs; valid language pair codes. |
| **Data & Analytics** | `dashboardSampleUrls` (Tableau/Looker/PowerBI)<br>`analyticalStack` (array) | "Showcases interactive visualization capabilities and business intelligence modeling." | Valid URLs. |
| **Admin & Support** | `toolProficiencies` (array)<br>`timezoneOffset` (number) | "Assists clients in scheduling shifts and matching communication tools." | Timezone range -12 to +14. |

> [!IMPORTANT]
> **Zero Personal Data Rule**: None of the category modules request email addresses, telephone numbers, OAuth access tokens, passwords, or personal physical addresses. Social links are validated purely via format regex without making background scraping requests.

---

## 4. Relational Data Model (Prisma Schema Migration Plan)

To support taxonomy, onboarding, creators, community, reviews, issues, and localization without contract changes, the database schema will be expanded.

```prisma
// ─── TAXONOMY TABLES ──────────────────────────────────────────

model Category {
  id            String         @id
  slug          String         @unique
  nameKey       String
  defaultName   String
  descKey       String
  defaultDesc   String
  themeColor    String         @default("cobalt")
  sortOrder     Int            @default(0)
  subcategories Subcategory[]
  jobs          JobCategory[]
  profiles      ProfileCategory[]
  createdAt     DateTime       @default(now())

  @@index([slug])
}

model Subcategory {
  id          String         @id
  categoryId  String
  category    Category       @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  slug        String
  nameKey     String
  defaultName String
  sortOrder   Int            @default(0)
  skills      Skill[]
  jobs        JobCategory[]

  @@unique([categoryId, slug])
  @@index([categoryId])
}

model Skill {
  id            String         @id @default(uuid())
  subcategoryId String
  subcategory   Subcategory    @relation(fields: [subcategoryId], references: [id], onDelete: Cascade)
  name          String
  slug          String
  synonyms      SkillSynonym[]
  profileSkills ProfileSkill[]
  jobSkills     JobSkill[]

  @@unique([subcategoryId, slug])
  @@index([name])
}

model SkillSynonym {
  id      String @id @default(uuid())
  skillId String
  skill   Skill  @relation(fields: [skillId], references: [id], onDelete: Cascade)
  synonym String @unique

  @@index([synonym])
}

// ─── PROFILE CATEGORIES & CREATOR EXTENSIONS ──────────────────

model ProfileCategory {
  id         String   @id @default(uuid())
  wallet     String
  categoryId String
  category   Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  isPrimary  Boolean  @default(false)
  createdAt  DateTime @default(now())

  @@unique([wallet, categoryId])
  @@index([wallet])
  @@index([categoryId, isPrimary])
}

model ProfileSkill {
  id        String   @id @default(uuid())
  wallet    String
  skillId   String
  skill     Skill    @relation(fields: [skillId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([wallet, skillId])
  @@index([wallet])
}

model CreatorAccount {
  id              String   @id @default(uuid())
  wallet          String
  platform        String   // 'youtube' | 'instagram' | 'tiktok' | 'podcast'
  handleOrUrl     String
  source          String   @default("self_reported") // 'self_reported' | 'verified_api'
  niche           String?
  followersCount  Int?     @default(0)
  avgViews        Int?     @default(0)
  engagementRate  Float?   @default(0.0)
  rateCard        Json?    // Array of { deliverable, priceUsdc }
  mediaKitUrl     String?
  isPublic        Boolean  @default(true)
  verifiedAt      DateTime?
  fetchedAt       DateTime @default(now())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([wallet])
  @@index([platform, niche])
}

// ─── JOB CATEGORY LINKING ─────────────────────────────────────

model JobCategory {
  id            String       @id @default(uuid())
  jobId         String
  categoryId    String
  category      Category     @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  subcategoryId String?
  subcategory   Subcategory? @relation(fields: [subcategoryId], references: [id], onDelete: SetNull)

  @@index([jobId])
  @@index([categoryId])
}

model JobSkill {
  id      String @id @default(uuid())
  jobId   String
  skillId String
  skill   Skill  @relation(fields: [skillId], references: [id], onDelete: Cascade)

  @@index([jobId])
}

// ─── COMMUNITY, REVIEWS & ISSUES ──────────────────────────────

model CommunityPost {
  id          String             @id @default(uuid())
  author      String             // Wallet address
  title       String
  slug        String             @unique
  content     String             // Sanitized markdown
  coverImage  String?            // Safe storage URL only
  tags        String[]
  language    String             @default("en")
  isPinned    Boolean            @default(false)
  upvotes     CommunityVote[]
  comments    CommunityComment[]
  reports     CommunityReport[]
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt

  @@index([author])
  @@index([createdAt])
  @@index([language])
}

model CommunityComment {
  id        String             @id @default(uuid())
  postId    String
  post      CommunityPost      @relation(fields: [postId], references: [id], onDelete: Cascade)
  author    String
  content   String
  parentId  String?            // For 1 level of nested replies
  parent    CommunityComment?  @relation("NestedReplies", fields: [parentId], references: [id])
  replies   CommunityComment[] @relation("NestedReplies")
  createdAt DateTime           @default(now())

  @@index([postId])
  @@index([author])
}

model ProjectReview {
  id              String   @id @default(uuid())
  jobId           String
  reviewerWallet  String
  revieweeWallet  String
  reviewerRole    String   // 'Client' | 'Freelancer'
  rating          Int      // 1 to 5
  comment         String
  onchainVerified Boolean  @default(true) // Confirmed against JobEscrow completion
  txHash          String?
  createdAt       DateTime @default(now())

  @@unique([jobId, reviewerWallet]) // Exactly one review per participant per job
  @@index([revieweeWallet])
  @@index([jobId])
}

model IssueReport {
  id          String              @id @default(uuid())
  reporter    String              // Wallet address
  title       String
  area        String              // 'Jobs' | 'Escrow' | 'Disputes' | 'Messages' | 'Profile' | 'Payments' | 'Other'
  steps       String
  expected    String
  actual      String
  environment Json?               // { browser, wallet, network }
  attachments String[]            // Hashed storage URLs, strictly validated
  status      String              @default("Open") // 'Open' | 'Acknowledged' | 'InProgress' | 'Fixed' | 'Closed' | 'WontFix' | 'Duplicate'
  history     IssueStatusEvent[]
  votes       IssueVote[]
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt

  @@index([reporter])
  @@index([status])
  @@index([area])
}

model IssueStatusEvent {
  id        String      @id @default(uuid())
  issueId   String
  issue     IssueReport @relation(fields: [issueId], references: [id], onDelete: Cascade)
  oldStatus String
  newStatus String
  changedBy String      // Admin wallet
  note      String?
  createdAt DateTime    @default(now())

  @@index([issueId])
}

model CommunityVote {
  id        String        @id @default(uuid())
  postId    String
  post      CommunityPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  voter     String

  @@unique([postId, voter])
}

model IssueVote {
  id      String      @id @default(uuid())
  issueId String
  issue   IssueReport @relation(fields: [issueId], references: [id], onDelete: Cascade)
  voter   String

  @@unique([issueId, voter])
}

model CommunityReport {
  id        String        @id @default(uuid())
  postId    String
  post      CommunityPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  reporter  String
  reason    String
  details   String?
  status    String        @default("Pending") // 'Pending' | 'Reviewed' | 'Dismissed'
  createdAt DateTime      @default(now())

  @@index([postId])
}

model ModerationLog {
  id         String   @id @default(uuid())
  action     String   // 'PostRemoved' | 'CommentRemoved' | 'IssueClosed'
  targetId   String
  targetType String   // 'Post' | 'Comment' | 'Issue'
  reasonCode String
  moderator  String   // Admin wallet
  timestamp  DateTime @default(now())

  @@index([timestamp])
}
```

---

## 5. API Endpoint Architecture (Port 3001)

All endpoints utilize cursor-based pagination, strict zod validation, and rate limiting.

### 5.1 Taxonomy & Discovery
- `GET /api/categories`: Returns full category tree with subcategories and localized names. Cacheable via ETag with `Cache-Control: public, max-age=3600`.
- `GET /api/categories/:slug`: Returns single category details, subcategories, and active job/freelancer counters.
- `GET /api/categories/:slug/jobs`: Cursor-paginated real jobs matching category.
  - Query params: `cursor`, `limit` (default 20), `subcategory`, `token` (`POL` | `USDC`), `minBudget`, `maxBudget`.
- `GET /api/categories/:slug/freelancers`: Cursor-paginated real freelancers whose primary or secondary category matches.
  - Query params: `cursor`, `limit`, `subcategory`, `token`, `availability`, `verifiedOnly` (boolean).
- `GET /api/skills/suggest`: Prefix & synonym search.
  - Query params: `q` (min 2 chars), `category` (optional). Returns top 15 matches.

### 5.2 Onboarding & Profile Management
- `PUT /api/onboarding/step`: Idempotent step-saver for authenticated session.
  - Payload: `{ step: number, data: Record<string, any> }`. Validates against category module schema.
- `GET /api/me/recommendations`: Returns real jobs (for freelancers) or real freelancers (for clients) based on saved category preferences.
- `GET /api/me/earnings.csv`: Authenticated user's verified earnings download. Returns CSV with columns: `Date`, `Token`, `Amount`, `Job ID`, `Transaction Hash`, `Status`.

### 5.3 Creators Directory
- `GET /api/creators`: Directory listing of creator accounts.
  - Query params: `platform`, `niche`, `minFollowers`, `maxFollowers`, `country`, `cursor`.
- `GET /api/creators/:wallet`: Public creator profile including rate card and portfolio links.

### 5.4 Community & Issues
- `GET /api/community/posts`: Paginated posts filtered by `tag`, `language`, or `category`.
- `POST /api/community/posts`: Create post (SIWE required; server-side markdown sanitization).
- `GET /api/community/reviews/:wallet`: Returns all verified reviews for an address.
- `POST /api/community/reviews`: Submit project review.
  - Verification: Backend calls contract or verified index to ensure job is completed and caller was a participant.
- `GET /api/community/issues`: Paginated issues list with status and upvote count.
- `POST /api/community/issues`: Submit issue report (includes security regex check for exploit keywords).
- `POST /api/community/issues/:id/vote`: Toggle upvote.
- `GET /api/community/moderation-log`: Public log of actions (shows reason code and timestamp; never removed content).

---

## 6. Frontend Route Map & Component Architecture

### Route Map:
| Route | Component | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `/welcome` | `OnboardingFlowPage.tsx` | Wallet connected, no profile | Multi-step onboarding with live preview |
| `/categories` | `CategoriesIndexPage.tsx` | Public | Grid of all 10 categories with subcategory links |
| `/categories/:slug` | `CategoryDetailPage.tsx` | Public | Category header, subcategory chips, Jobs / Freelancers tabs |
| `/creators` | `CreatorsDirectoryPage.tsx` | Public | Creator directory with filters and rate cards |
| `/creators/:wallet` | `CreatorProfilePage.tsx` | Public | Creator portfolio, self-reported stats, collab request CTA |
| `/community` | `CommunityPage.tsx` | Public | Forum tabs: Stories, Reviews, Issues, Guidelines |
| `/community/post/:id` | `CommunityPostDetailPage.tsx` | Public | Sanitized markdown story with comment tree |
| `/community/issues` | `CommunityIssuesPage.tsx` | Public | Public issue tracker with status lifecycle |
| `/community/issues/:id`| `IssueDetailPage.tsx` | Public | Issue details and team responses |
| `/community/guidelines`| `CommunityGuidelinesPage.tsx` | Public | Community standards & pending moderation rules |
| `/community/moderation-log` | `ModerationLogPage.tsx` | Public | Transparent moderation activity ledger |
| `/how-it-works#india-tax` | `HowItWorksPage.tsx` | Public | India tax explainer timeline, myth/fact, and calculator |

### Mega-Menu & Footer Updates:
1. **Header Mega-Menu**: A "Categories" trigger in [`Navbar.tsx`](file:///c:/Movies/Polylance/polylance/frontend/src/components/Navbar.tsx).
   - Desktop: Flyout mega-menu with 10 categories on left, subcategories on right.
   - Mobile: Slide-over drawer with hierarchical drill-down.
2. **Footer Update**:
   - Add `"Community"` link under the *Resources* column in [`LandingFooter.tsx`](file:///c:/Movies/Polylance/polylance/frontend/src/components/layout/LandingFooter.tsx).
   - Add Language Switcher dropdown.
   - Retain bottom-left `"PolyLance Protocol"` (no copyright statement).

---

## 7. Internationalization (i18n) Architecture

### 7.1 Framework, Domain & URL Routing Strategy
- **Production Domain**: `polylancezenith.com` (SIWE domain, sitemaps, canonicals, CORS).
- **URL Routing Strategy (Approved Option A — Subpath Prefix)**:
  - English (default): `/` or `/en/...`
  - Localized routes: `/:lang/...` (e.g. `/hi/jobs`, `/ar/categories`, `/ja/how-it-works`).
  - React Router configuration will support an optional `:lang?` prefix parameter on all public routes.
  - Switching languages via the header/footer dropdown updates the URL pathname (`/jobs` -> `/hi/jobs` -> `/ar/jobs`), preserving query parameters and hash anchors (e.g., `#india-tax`).
  - Auto-detection: Offers a dismissible suggestion toast based on `navigator.languages` ("Would you like to browse PolyLance in Hindi? [Switch to /hi] [Dismiss]"); **never** redirects or switches automatically without explicit user action.
  - Choice persisted in `localStorage` (wrapped in try/catch) and synced to `userProfile.language` when logged in.
- **Library**: `i18next` + `react-i18next` + `i18next-browser-languagedetector`.
- **Supported Languages**:
  1. English (`en`, Default, 100% complete)
  2. Hindi (`hi`)
  3. Bengali (`bn`)
  4. Marathi (`mr`)
  5. Telugu (`te`)
  6. Tamil (`ta`)
  7. German (`de`)
  8. Russian (`ru`)
  9. Japanese (`ja`)
  10. Arabic (`ar` — UAE, RTL)
  11. French (`fr`)
  12. Spanish (`es`)

### 7.2 Directory & Namespace Structure
Translations are split into route-level and common namespaces under `frontend/src/locales/`:
```
frontend/src/locales/
  ├── en/
  │    ├── common.json
  │    ├── landing.json
  │    ├── onboarding.json
  │    ├── categories.json
  │    ├── jobs.json
  │    ├── community.json
  │    ├── tax.json
  │    └── legal.json
  ├── ar/
  ├── hi/
  └── ... (other languages)
```
- **Lazy Loading**: `i18next-http-backend` loads only the active language and active route namespace on demand (e.g., `/welcome` loads only `common.json` and `onboarding.json`).

### 7.3 RTL Handling (Arabic `ar`)
- Document Root: `document.documentElement.dir = i18n.dir(currentLang)` (`'rtl'` for `ar`, `'ltr'` for others) and `lang = currentLang`.
- **CSS Logical Properties**:
  - Replace `ml-*` / `mr-*` with `ms-*` (margin-inline-start) and `me-*` (margin-inline-end).
  - Replace `pl-*` / `pr-*` with `ps-*` and `pe-*`.
  - Replace `left-*` / `right-*` with `start-*` and `end-*`.
- **Bidi Isolation**:
  - Wallet addresses, transaction hashes, URLs, and token symbols (`POL`, `USDC`) will be wrapped in `<bdi dir="ltr">...</bdi>` to prevent reversing.
  - Numbers and amounts strictly use Latin digits (`0-9`) in all locales.

### 7.4 Font Strategy per Script
- **Devanagari (`hi`, `mr`)**: Red Hat Text fallback to `Noto Sans Devanagari` (self-hosted WOFF2 subset).
- **Bengali (`bn`)**: `Noto Sans Bengali` (self-hosted WOFF2 subset).
- **Telugu (`te`)**: `Noto Sans Telugu` (self-hosted WOFF2 subset).
- **Tamil (`ta`)**: `Noto Sans Tamil` (self-hosted WOFF2 subset).
- **Arabic (`ar`)**: `Noto Sans Arabic` (self-hosted WOFF2 subset).
- **Cyrillic (`ru`)**: Red Hat Text / Red Hat Display already contains Latin + Cyrillic subsets.
- **Japanese (`ja`)**: System font stack (`system-ui, -apple-system, 'Hiragino Sans', 'Meiryo', 'Yu Gothic', sans-serif`) to prevent downloading 10MB+ Japanese CJK font files.

---

## 8. India Tax Explainer Specification (`#india-tax`)

### 8.1 Core Principles & Legal Disclosures
- **Banner**: *"Educational information, not tax advice. Confirm with a chartered accountant."*
- **Audit Line**: *"Last reviewed: November 2026. Based on Income-tax Act, 1961 provisions (including Sec 115BBH & 194S) and anticipated 2025/2026 enactment updates. Confirm with current law at incometaxindia.gov.in."*
- **Disclaimer**: *"PolyLance does not deduct, withhold, or file tax on behalf of any user. Users are solely responsible for local statutory compliance."*

### 8.2 Content Structure
1. **Two-Moment Timeline**:
   - **Moment 1 (Receipt of Milestone)**: Taxed as professional/business income at normal slab rates based on the INR fair market value (FMV) on the date of receipt. (Optional Section 44ADA presumptive taxation scheme may apply for eligible professionals).
   - **Moment 2 (Subsequent Sale/Swap)**: Section 115BBH flat 30% (+4% cess) applies **only to the capital gain** (Sale Price minus FMV at Receipt). No loss set-off against other income. The income taxed at receipt is **not** taxed again.
2. **1% TDS (Section 194S)**: Creditable against overall annual tax liability.
3. **Myth vs. Fact Block**:
   - *Myth*: "I have to pay a flat 30% tax on everything I earn."  
     *Fact*: No. Receipt is treated as normal professional income at your slab rate. Flat 30% applies only to additional gains when selling or trading the tokens.
   - *Myth*: "My crypto earnings are taxed twice."  
     *Fact*: No. The cost basis is the fair market value when received. Only profit above that basis is taxed at 30%.
   - *Myth*: "Taxes only apply when I withdraw INR to my bank."  
     *Fact*: On-chain milestone receipt constitutes realization of income. Always record date, token amount, and INR exchange rate at time of receipt.
4. **Worked-Example Calculator**:
   - **Inputs**: Tokens received, INR rate at receipt, Sale price in INR, User's tax slab (5%, 10%, 15%, 20%, 30%).
   - **Formulas**:
     $$\text{Receipt Income (INR)} = \text{Tokens} \times \text{Receipt Rate}$$
     $$\text{Receipt Slab Tax} = \text{Receipt Income} \times \text{Slab \%}$$
     $$\text{Net Gain upon Sale} = \max(0, (\text{Sale Rate} - \text{Receipt Rate}) \times \text{Tokens})$$
     $$\text{Gain Tax (30\% + 4\% cess)} = \text{Net Gain} \times 0.312$$
     $$\text{1\% TDS on Sale} = (\text{Tokens} \times \text{Sale Rate}) \times 0.01$$
     $$\text{Total Tax Net of TDS} = (\text{Receipt Slab Tax} + \text{Gain Tax}) - \text{TDS}$$

---

## 9. Phasing, Risks & Privacy Assessment

### 9.1 Phasing Roadmap
- **Phase 1: i18n Infrastructure & String Extraction**
  - Install `i18next`, setup locale files, language switcher, RTL styling, logical properties.
- **Phase 2: Taxonomy Engine & Category Browsing**
  - Seed taxonomy JSON, build Mega-Menu, `/categories`, and `/categories/:slug` discovery pages.
- **Phase 3: New Onboarding Flow (`/welcome`)**
  - Implement `/welcome` with tactile onboarding palette, dynamic category modules, and live real-data preview.
- **Phase 4: Creators Directory & Collab Briefs**
  - Implement `/creators`, creator profiles, self-reported metrics indicators, and collab brief generator.
- **Phase 5: Community, Reviews & Issue Tracker**
  - Implement `/community` stories, verified completion reviews, issues board, guidelines, and moderation log.
- **Phase 6: India Tax Explainer (`#india-tax`) & Backend Sync**
  - Add tax section to `HowItWorksPage.tsx`, tax calculator, `/api/me/earnings.csv` export endpoint, and Prisma migrations.

### 9.2 Privacy & Regulatory Assessment
- **India DPDP Act (2023) Compliance**:
  - PolyLance collects zero personal identifying information (no real names required, no email, no phone, no KYC).
  - All profile metadata is pseudonymously bound to public cryptographic wallet addresses.
  - Data export (`/api/me/earnings.csv`) and profile deletion (`DELETE /api/me/profile`) will be fully supported.
- **Contract Impact**:
  - **Zero smart contract changes required**. All features operate seamlessly over existing `JobEscrow` and `ReputationSBT_v2` contracts.

---

## 10. Open Questions for User Approval

Before any code modification begins, please confirm:

1. **i18n URL Routing Strategy**:
   - **Option A (Subpath Prefix)**: `polylance.codes/hi/jobs`, `polylance.codes/ar/categories` (better for regional SEO indexing, requires React Router prefixing).
   - **Option B (Query Parameter / Header State)**: `polylance.codes/jobs?lang=hi` or state-only with localStorage (simpler routing, zero URL clutter).
   *Which URL routing pattern do you prefer?*

2. **Extra Taxonomy Subcategories**:
   - Do you approve adding the 4 proposed subcategories (`DeFi Protocol Engineering`, `NFT & Gaming Smart Contracts`, `Substack & Beehiiv Writers`, `Embedded Systems & IoT`), or should we stick strictly to the original list?

3. **Tax Explainer Price Source**:
   - For the `/api/me/earnings.csv` export, should we keep the INR column omitted (leaving only Token Amount, Token Symbol, Date, and TxHash), or would you like to integrate a public Coingecko historical price oracle for estimated INR FMV at receipt?

