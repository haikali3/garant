# Garant

<img src="frontend/public/logo.png" alt="Garant Logo" width="120" />

**Ownership-based trust for modern applications**

Garant is a Web3-enabled trust and access control platform that bridges on-chain and off-chain systems. It provides wallet-based authentication, cryptographic identity verification, and blockchain-backed access control—enabling developers to build applications where user permissions are secured by smart contracts.

---

## 🎯 Why Garant?

Modern applications face three fundamental problems:

1. **Broken Authentication** - Passwords are insecure and OAuth centralizes user identity
2. **Fragmented Trust** - On-chain ownership and off-chain logic don't communicate
3. **Complex Access Control** - Managing permissions across applications is tedious and error-prone

Garant solves this by:
- Replacing passwords with cryptographic wallet signatures (Sign-in with Ethereum)
- Enabling on-chain ownership verification directly in your app
- Providing simple, contract-backed access rules

---

## ✨ Core Features

### Authentication
- **Wallet-based Sign-in** - Sign in with any Ethereum wallet using SIWE (Sign-in with Ethereum)
- **Multi-chain Support** - Single user account across Ethereum, Base, and other EVM chains
- **Nonce-based Replay Protection** - Secure, non-replayable authentication
- **JWT Sessions** - Standard token-based session management

### Access Control
- **ERC-20 Balance Verification** - Require users to hold specific tokens
- **ERC-721 Ownership** - Gate features behind NFT ownership
- **ERC-1155 Support** - Complex semi-fungible token permissions
- **Access Rule Engine** - Define and enforce permissions programmatically

### Developer Experience
- **REST API** - Simple endpoints for auth and access checks
- **Type-safe Backend** - Full TypeScript + Zod validation
- **React Hooks & Components** - Pre-built UI components for wallet connection
- **Production-ready** - Built on battle-tested infrastructure (Cloudflare)

---

## 🛠 Tech Stack

### Backend
- **Framework**: [Hono](https://hono.dev/) - Lightweight, fast TypeScript web framework
- **Database**: Cloudflare D1 (SQLite)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Web3**: [viem](https://viem.sh/), [SIWE](https://login.xyz/)
- **Auth**: JWT with [jose](https://github.com/panva/jose)
- **Validation**: [Zod](https://zod.dev/)
- **Deployment**: Cloudflare Workers

### Frontend
- **Framework**: [Next.js 15](https://nextjs.org/) + React 19
- **State Management**: [TanStack Query](https://tanstack.com/query/) (React Query)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Web3 Integration**: [wagmi](https://wagmi.sh/) + [viem](https://viem.sh/)
- **Forms**: [React Hook Form](https://react-hook-form.com/)
- **Styling**: [TailwindCSS 4](https://tailwindcss.com/)
- **Themes**: [next-themes](https://github.com/pacocoursey/next-themes)
- **Deployment**: Cloudflare Pages (via OpenNext)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm
- Cloudflare account for deployment

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/garant.git
cd garant

# Install dependencies
pnpm install

# Setup environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Running Locally

**Backend:**
```bash
cd backend
pnpm dev
# Server runs at http://localhost:8787
```

**Frontend:**
```bash
cd frontend
pnpm dev
# App runs at http://localhost:3000
```

### Environment Configuration

**Backend** (`.env` or `wrangler.jsonc`):
```
D1_DATABASE=your-d1-database-id
ETHEREUM_RPC_URL=https://eth.llamarpc.com
BASE_RPC_URL=https://base.llamarpc.com
JWT_SECRET=your-jwt-secret
```
Tip: You can find public RPC URLs (mainnet/Base) at https://chainlist.org/chain/1

**Frontend** (`.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:8787
NEXT_PUBLIC_CHAIN_ID=8453
```

---

## 📚 Architecture

### System Design

```
┌─────────────────┐         ┌──────────────────────┐
│   User Wallet   │         │   Web Browser        │
│ (MetaMask, etc) │         │  (Next.js Frontend)  │
└────────┬────────┘         └──────────┬───────────┘
         │                             │
         │         SIWE Sign           │
         │◄────────────────────────────┤
         │                             │
         │         Signed Message      │
         ├────────────────────────────►│
         │                             │
         │         JWT Token           │
         │◄────────────────────────────┤
         │                             │
         └─────────────────────────────┘
                     │
         ┌───────────▼────────────┐
         │  Hono Backend Server   │
         │  (Cloudflare Workers)  │
         └───────────┬────────────┘
                     │
         ┌───────────▼────────────┐
         │   D1 Database          │
         │   (SQLite)             │
         └───────────┬────────────┘
                     │
         ┌───────────▼────────────┐
         │   Blockchain RPC       │
         │   (viem, ethers)       │
         └────────────────────────┘
```

### Database Schema

- **users** - User accounts
- **wallets** - Multi-chain wallet mappings (address + chainId)
- **auth_nonces** - Authentication nonces (SIWE)
- **sessions** - Active JWT sessions
- **access_rules** - Permission definitions (token requirements)
- **access_assignments** - User → rule mappings
- **contracts** - Tracked smart contracts
- **events** - Indexed contract events

### Authentication Flow

1. User connects wallet → Request nonce via `POST /auth/nonce`
2. Frontend creates SIWE message with nonce, domain, chainId
3. User signs message with wallet
4. Frontend submits signed message → `POST /auth/verify`
5. Backend verifies signature, creates JWT token
6. Frontend stores token, includes in subsequent API requests

---

## 🔌 API Reference

### Authentication Endpoints

**Generate Authentication Nonce**
```
POST /auth/nonce
Content-Type: application/json

{
  "address": "0x742d35Cc6634C0532925a3b844Bc555e64A47F2b",
  "chainId": 8453
}

Response:
{
  "nonce": "f42c3fb1-4b5a-4d8e-9c3b-2a1f0e5d6c9b"
}
```

**Verify Signed Message & Get JWT**
```
POST /auth/verify
Content-Type: application/json

{
  "address": "0x742d35Cc6634C0532925a3b844Bc555e64A47F2b",
  "chainId": 8453,
  "message": "...",
  "signature": "0x..."
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "address": "0x742d35Cc6634C0532925a3b844Bc555e64A47F2b"
}
```

**Get Current User**
```
GET /auth/me
Authorization: Bearer <token>

Response:
{
  "address": "0x742d35Cc6634C0532925a3b844Bc555e64A47F2b",
  "wallets": [
    { "address": "0x...", "chainId": 8453 }
  ],
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Access Control Endpoints

**Check Token Balance**
```
GET /access/check?contractAddress=0x...&tokenId=1
Authorization: Bearer <token>

Response:
{
  "hasAccess": true,
  "balance": "10",
  "cachedAt": "2024-01-15T10:30:00Z"
}
```

See [API Testing Guide](./docs/api-testing-guide.md) for more examples.

---

## 🧑‍💻 Development

### Project Structure

```
garant/
├── backend/                 # Hono + Cloudflare Workers
│   ├── src/
│   │   ├── index.ts        # Main app setup
│   │   ├── routes/         # Auth & access endpoints
│   │   ├── services/       # Business logic
│   │   ├── db/             # Schema & migrations
│   │   └── lib/            # Utilities
│   ├── wrangler.jsonc      # Cloudflare config
│   └── package.json
│
├── frontend/                # Next.js + React
│   ├── src/
│   │   ├── app/            # Pages & layout
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom hooks
│   │   └── lib/            # Utilities
│   ├── next.config.ts
│   └── package.json
│
└── docs/                    # Documentation
    ├── prd.md              # Product requirements
    ├── api-testing-guide.md
    └── drizzle-guide.md
```

### Code Quality

The project uses [Biome](https://biomejs.dev/) for linting and formatting:

```bash
# Backend
cd backend
pnpm lint      # Check linting
pnpm format    # Auto-format code

# Frontend
cd frontend
pnpm lint
pnpm format
```

### Database Migrations

Using Drizzle ORM:

```bash
cd backend

# Generate migration
pnpm run db:generate

# Migrate locally (for testing)
pnpm run db:migrate:local

# Migrate production D1
pnpm run db:migrate:remote
```

See [Drizzle Setup Guide](./docs/drizzle-guide.md) for details.

### Testing

```bash
# Type checking
cd backend && pnpm typecheck
cd frontend && pnpm typecheck

# API Testing with Postman
# Import collection from ./postman/
```

---

## 🌍 Supported Chains

- **Ethereum Mainnet** (chainId: 1)
- **Base** (chainId: 8453)
- **Sepolia Testnet** (chainId: 11155111)
- **Base Sepolia** (chainId: 84532)

Additional chains can be added by updating RPC URLs in environment config.

---

## 🚢 Deployment

### Backend (Cloudflare Workers)

```bash
cd backend

# Deploy to production
pnpm run deploy

# Preview deployment
wrangler deployments list
```

### Frontend (Cloudflare Pages)

```bash
cd frontend

# Build
pnpm run build

# Deploy preview
pnpm run preview

# Deploy to production (via git)
# Push to main branch - automatic deployment
```

See [wrangler.jsonc](./backend/wrangler.jsonc) for Cloudflare configuration.

---

## 🗺 Future Enhancements

### Short Term
- [ ] **Multi-signature Wallets** - Support for Safe and other multisig protocols
- [ ] **Email Recovery** - Backup authentication methods
- [ ] **Rate Limiting** - API rate limiting and DDoS protection
- [ ] **Audit Logs** - Complete authentication and access audit trails

### Medium Term
- [ ] **ENS Integration** - Support for Ethereum Name Service resolution
- [ ] **Social Recovery** - Guardian-based account recovery
- [ ] **Custom Validators** - User-defined access control logic
- [ ] **WebAuthn Support** - Passwordless authentication with hardware keys
- [ ] **Analytics Dashboard** - Real-time usage and access metrics

### Long Term
- [ ] **Chain Abstraction** - Cross-chain account unification
- [ ] **Programmable Access Rules** - WASM-based custom permission logic
- [ ] **Decentralized Identity** - DID integration and on-chain reputation
- [ ] **Zero-Knowledge Proofs** - Privacy-preserving access verification
- [ ] **Smart Account Integration** - ERC-4337 account abstraction support
- [ ] **Governance Module** - DAO-based permission management

### Research
- [ ] Account recovery without centralized authority
- [ ] Private access rules (encrypted contract conditions)
- [ ] Cross-protocol access (combining data from multiple blockchains)

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- Use TypeScript for all code
- Follow Biome formatting rules (`pnpm format`)
- Add tests for new features
- Update documentation as needed
- Use shadcn/ui components for frontend UI
- Use TanStack Query for data fetching

---

## 📖 Documentation

- [Product Requirements Document](./docs/prd.md) - Complete feature specifications
- [API Testing Guide](./docs/api-testing-guide.md) - API endpoint examples and testing
- [Drizzle ORM Setup](./docs/drizzle-guide.md) - Database setup and workflows
- [Project TODOs](./docs/todo.md) - Current development tasks


## 🔗 Resources

- [SIWE (Sign-in with Ethereum)](https://login.xyz/)
- [wagmi Documentation](https://wagmi.sh/)
- [Hono Framework](https://hono.dev/)
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [TanStack Query](https://tanstack.com/query/)

---

## ❓ FAQ

**Q: How does Garant handle private keys?**
A: Garant never touches private keys. Authentication happens entirely on the user's device through their wallet (MetaMask, Ledger, etc.). We only receive signed messages.

**Q: Can I self-host Garant?**
A: Yes! The backend is designed to run on Cloudflare Workers, but can be adapted to other serverless platforms. The frontend is a standard Next.js app.

**Q: What happens if the RPC goes down?**
A: Access checks have a 30-second cache. If the RPC fails, cached results are used. For critical applications, configure fallback RPC URLs.

**Q: How do I add a new token for access control?**
A: Create an access rule in the database with the token contract address and required balance. See the API documentation for examples.
