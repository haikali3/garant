# Garant - Project Context

## Overview
Garant is a Web3-enabled trust and access platform that verifies ownership, permissions, and identity using wallet signatures and smart contracts, while keeping complex logic off-chain via APIs.

## Quick Reference

### Tech Stack
- **Frontend**: Next.js, wagmi, viem, TailwindCSS, shadcn/ui, React Query, Zod
- **Backend**: Hono (TypeScript), PostgreSQL (Neon), Drizzle ORM, Redis (Upstash)
- **Smart Contracts**: Solidity, Foundry, OpenZeppelin
- **Infrastructure**: Cloudflare Workers/Pages/R2

### Project Structure
```
garant/
├── backend/        # Hono API (Cloudflare Workers)
├── docs/           # Documentation including PRD
└── bin/            # Scripts
```

### Key Concepts
- **Wallet Authentication**: Sign-in with Ethereum (SIWE) using signatures
- **Ownership Verification**: Check ERC-20/721/1155 token balances
- **Access Control**: Rules based on on-chain token ownership
- **Event Indexing**: Store contract events in PostgreSQL

### Common Commands
```bash
# Backend development
cd backend && npm run dev

# Database
npm run db:generate  # Generate migrations
npm run db:push      # Push schema to DB
```

### Skills Available
- `/web3` - Web3 expert for wallet auth, smart contracts, and EVM interactions

### Documentation
- PRD: `docs/prd.md`
- Drizzle Guide: `docs/drizzle.md`
