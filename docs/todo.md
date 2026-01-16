We’re building the Garant backend MVP: a Hono API on Cloudflare Workers with D1 + Drizzle that handles
wallet auth (nonce + signature → JWT), ownership verification (ERC‑20/721/1155), access rules
enforcement, and an activity/events feed sourced from contract events.

- learn erc-standards
- what is wallet auth flow?
- implement wallet auth (nonce + signature → JWT)
- implement ownership verification (ERC‑20/721/1155)
- implement access rules enforcement
- implement activity/events feed sourced from contract events
- write tests



Guidelines:
- Backend auth: implement POST /auth/nonce, POST /auth/verify (SIWE), issue JWT; add rate limiting, nonce expiry, chainId validation.
- Data layer: define Drizzle models (User, Wallet, AuthNonce, Session, AccessRule, AccessAssignment); enforce unique (address, chainId).
- Ownership checks: implement ERC-20/721/1155 verify via viem; add caching (Redis) and optional real-time recheck; endpoint POST /access/check.
- Contracts + indexing: minimal contract emitting access/role events; worker to index events into DB (IndexedContracts/Events).
- Frontend: Next.js with wagmi/viem SIWE flow, session handling, gated UI using /access/check; basic profile (/me).
- Ops: env/secrets, RPC providers, Cloudflare Workers/Pages deploy, Upstash Redis; add minimal logging and error handling.

Checklist:
- [ ] /auth/nonce, /auth/verify, JWT sessions
- [ ] Drizzle schema + migrations pushed
- [ ] Wallet link: unique (address, chainId)
- [ ] /access/check with ERC-20/721/1155 support
- [ ] Redis caching + rate limiting
- [ ] Event-emitting contract deployed
- [ ] Indexer writing events to DB
- [ ] Frontend SIWE + gated routes
- [ ] Cloudflare deploy wired, envs set
- [ ] Smoke tests for auth, access, indexing
