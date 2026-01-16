---
name: web3-expert
description: Web3 expertise for Garant. Use when working on wallet authentication (SIWE/EIP-4361, EIP-712), signature verification, token ownership checks (ERC-20/721/1155), smart contracts (Solidity/Foundry/OpenZeppelin), event indexing, access control, or EVM integrations on Ethereum/Base networks.
---

# Web3 Expert

## Overview

Apply Garant-specific Web3 patterns for wallet auth, ownership verification, smart contracts, indexing, and access control. Prefer viem and wagmi, keep logic minimal on-chain, and treat RPC costs and security as first-class constraints.

## Core Capabilities

### 1. Wallet Authentication (SIWE/EIP-712)
- Implement EIP-4361 flows with server-side signature verification.
- Use EIP-712 typed data when human-readable signing is needed.
- Enforce nonce expiration, single-use nonces, and short session TTLs.
- Issue and verify JWTs after signature verification.

### 2. Token Ownership Verification
- ERC-20: check `balanceOf(address)`.
- ERC-721: check `ownerOf(tokenId)` or `balanceOf(address)`.
- ERC-1155: check `balanceOf(address, tokenId)`.
- Cache ownership checks with TTL, and invalidate on Transfer events.
- Batch calls with multicall where available to minimize RPC load.

### 3. Smart Contract Development
- Use Solidity ^0.8.x with OpenZeppelin contracts.
- Prefer minimal, event-driven on-chain logic.
- Use Foundry (forge/cast/anvil) for development and testing.
- Choose upgradeability only when required; favor UUPS if needed.

### 4. Event Indexing
- Emit events with indexed fields for filtering.
- Track confirmations to handle reorgs before finalizing data.
- Store parsed logs in PostgreSQL with block metadata.

### 5. Access Control Patterns
- Token gating (min balance, specific token ownership).
- Role-based access with AccessControl where needed.
- Merkle proofs for allowlists/airdrops.
- Time-based permissions with `block.timestamp`.

## Default Tech Stack Choices

- Frontend: Next.js (App Router), wagmi v2, viem, TanStack Query, Tailwind + shadcn/ui, Zod.
- Backend: Hono on Cloudflare Workers, PostgreSQL (Neon), Drizzle, Redis (Upstash), JWT via `jose` or `hono/jwt`.
- Infrastructure: Cloudflare Pages + Workers + R2.

## Security Checklist

- Verify signatures server-side; never trust client claims.
- Bind signatures to chain ID to prevent cross-chain replay.
- Validate addresses with `viem` `isAddress`.
- Limit auth endpoints (rate limit) and RPC calls.
- Never store private keys; never expose RPC secrets to frontend.

## Common Workflows

### Wallet Login (SIWE)
1. Generate nonce server-side and store with expiry.
2. Send nonce to client; client signs SIWE message.
3. Verify signature and nonce server-side.
4. Issue JWT and return session.

### Ownership Check
1. Read address from JWT.
2. Resolve access rules for the resource.
3. Check cached ownership or call RPC.
4. Return allow/deny with optional reason.

### Event Indexing
1. Subscribe to contract logs.
2. Parse events and store with block metadata.
3. Confirm N blocks before finalizing.
4. Expose query API for feeds and audits.

## Supported Networks (MVP)

- Ethereum Mainnet (1)
- Ethereum Sepolia (11155111)
- Base (8453)
- Base Sepolia (84532)
