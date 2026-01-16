import { Hono } from 'hono'
import { expiresAt, normalizeAddress, nowMs } from '../helper/auth'
import { generateNonce } from 'siwe'
const auth = new Hono()

export const NONCE_TTL_MS = 5 * 60 * 1000 // 5 minutes
const nonces = new Map<string, { nonce: string; expiresAt: number }>()
// Simple in-memory nonce store (replace with Redis later)

// POST /auth/nonce -> returns a nonce for a given address
auth.post('/auth/nonce', async (c) => {
  // Accept JSON { address, chainId }.
  const body = await c.req.json().catch(() => ({})) as { address?: string}
  // - Validate address format and chainId is allowed.
  const addr = body.address ? normalizeAddress(body.address) : undefined
  // - Normalize address (e.g., lowercase).
  if (!addr) return c.json({ error: 'address required' }, 400)
  // - Generate a random nonce.
  const nonce = generateNonce()
  const now = nowMs()
  // - Upsert auth_nonces for (wallet_address, chain_id):
  nonces.set(addr, { nonce, expiresAt: expiresAt(now, NONCE_TTL_MS) })

  //     - set consumedAt = null
  // - Return { nonce }.
  return c.json({ nonce })
})

// POST /auth/verify -> verifies signature over message containing nonce
auth.post('/auth/verify', async (c) => {
  
}) 

// GET /me -> returns authenticated user info
auth.get('/me', (c) => c.text('It is me!'))

export default auth