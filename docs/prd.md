---

# 📄 Product Requirements Document (PRD)

## Product Name

**Garant**

## Tagline

**Verifiable intent and ownership for modern applications**

---

## 1. Overview

Garant is a **Web3-enabled verification and access platform** that allows applications to verify ownership and intent using **cryptographic signatures**, while keeping complex logic **off-chain via APIs**.

Garant acts as a **guarantor of access and intent**, bridging on-chain truth with off-chain systems such as databases, APIs, AI services, and payments.

---

## 2. Problem Statement

Modern applications face three major issues:

1. **Authentication is broken**

   * Passwords are insecure
   * OAuth accounts are siloed
   * Users do not truly own their identity

2. **On-chain data is hard to use**

   * Raw blockchain reads are slow
   * Indexing is complex
   * Smart contracts are not suited for business logic

3. **Trust is fragmented**

   * Ownership lives on-chain
   * Logic lives off-chain
   * There is no clean bridge between them

---

## 3. Solution

Garant provides:

* One-shot verification using **cryptographic signatures**
* Smart-contract-verified ownership and permissions
* A backend API that **guarantees intent**, roles, and balance truth
* A clean developer interface for building **token-gated and ownership-aware apps**

Garant does **not replace smart contracts**.
It **guarantees** that off-chain actions respect on-chain truth.

---

## 4. Target Users

### Primary

* Full-stack developers building Web3 or hybrid apps
* Indie hackers and startups
* Engineers who want Web3 features without UX pain

### Secondary

* SaaS platforms adding wallet login
* Communities with gated access
* NFT / token-based products

---

## 5. Core Use Cases

* Wallet login without passwords
* Token or NFT-gated access
* Role-based permissions backed by smart contracts
* Verified user profiles linked to wallets
* Event-driven on-chain activity feeds
* Off-chain actions guaranteed by on-chain ownership

---

## 6. Key Features (MVP)

### 6.1 Signature Verification & Intent

* Sign-in with Ethereum (signature based) for proof of intent
* Nonce-based replay protection
* Stateless: No permanent user sessions required
* Address canonicalization: store `address` normalized (lowercase)

---

### 6.2 Ownership Verification

* Verify ERC-20, ERC-721, ERC-1155 ownership
* Chain-supported: Ethereum Mainnet, Base, Sepolia Testnet
* Cached verification via API
* Optional real-time recheck on critical actions

---

### 6.3 Access Control Engine

* Define access rules:

  * Own token X
  * Own NFT from contract Y
  * Minimum balance threshold
* API enforces access before allowing actions
* Smart contract is the source of truth

---

### 6.4 Smart Contract Layer

* Minimal contracts
* Emit events for:

  * Access grants
  * Revocations
  * Role updates
* No heavy logic on-chain

---

### 6.5 Event Indexing

* Index contract events
* Store in relational DB
* Power dashboards and feeds
* Enable fast querying

---

### 6.6 Developer API

* REST API
* Auth-protected endpoints
* Clear error states
* Deterministic responses

Example endpoints:

* `POST /auth/nonce`
* `POST /auth/verify`
* `GET /me`
* `POST /access/check`
* `GET /activity`

---

## 7. Non-Goals (Explicitly Out of Scope)

* No custom wallet
* No token issuance platform
* No DAO tooling
* No financial custody
* No private key storage

Garant is **infrastructure**, not a consumer wallet.

---

## 8. Technical Architecture

### Frontend

* Next.js (React + TypeScript)
* wagmi + viem (wallet interactions)
* TailwindCSS + shadcn/ui
* React Query for data fetching
* Zod for validation

### Backend

* Hono (TypeScript)
* Cloudflare D1 (SQLite)
* Drizzle ORM (SQLite driver)
* Redis (rate limiting, caching)
* Cloudflare Workers deployment

### Smart Contracts

* Solidity
* Foundry
* OpenZeppelin libraries
* Event-driven design

### Infrastructure

* Cloudflare Pages (frontend)
* Cloudflare Workers (API)
* Cloudflare R2 (storage)
* Upstash Redis

---

## 9. Data Models (High-Level)

### Identity & Intent

Garant verifies that a specific `address` on a specific `chainId` owns a resource or has authorized an action via signature. It does not manage persistent user profiles.


### AuthNonce (Wallet Authentication)

* `id`
* `nonce`
* `walletAddress`
* `chainId`
* `createdAt`
* `expiresAt`
* `consumedAt` (optional)

### Session

* `id`
* `userId` (FK → `users.id`)
* `createdAt`
* `expiresAt`
* `revokedAt` (optional)

### AccessRule

* `id`
* `name` (optional)
* `ruleType` (e.g. `erc20`, `erc721`, `erc1155`)
* `contractAddress`
* `chainId`
* `tokenId` (optional)
* `minBalance` (optional)
* `createdAt`

### AccessAssignment

* `id`
* `accessRuleId` (FK → `access_rules.id`)
* `walletAddress`
* `assignedAt`

### Indexed Contracts

* `id`
* `address`
* `chainId`
* `contractType`
* `createdAt`

### Indexed Events

* `id`
* `contractId` (FK → `contracts.id`)
* `eventType`
* `txHash`
* `logIndex`
* `blockNumber`
* `payload` (raw event payload)
* `createdAt`

---

## 10. Security Considerations

* Signature verification required for all actions
* Nonce absolute expiration enforced
* Rate limiting on auth endpoints
* Chain ID validation
* No sensitive secrets exposed to frontend
* All critical checks verifiable on-chain

---

## 11. MVP Success Criteria

* Signature is verified correctly against address
* Backend verifies ownership correctly
* Access permissions are computed deterministically
* Contract events are indexed correctly
* App remains fast under RPC limits
* Clean DX and readable codebase

---

## 12. Future Extensions

* Multi-chain support (Additional EVM chains)
* Gasless transactions
* Fine-grained role hierarchies
* OAuth bridge (wallet + Google)
* AI-driven permission insights
* Enterprise audit logs

---

## 13. One-Line Pitch

**Garant is a verification layer that guarantees off-chain actions respect cryptographic truth.**

---

If you want next, I can:

* Turn this into a **README.md**
* Write **resume bullets** using Garant
* Design **API contracts**
* Define **exact smart contract ABI**
* Create **landing page copy**

Just tell me what you want to build next.

