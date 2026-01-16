import { Hono } from 'hono'
import { expiresAt, normalizeAddress, nowMs } from '../helper/auth'
import { generateNonce } from 'siwe'
import z from 'zod'
import { Hex } from 'viem'
const auth = new Hono()

export const NONCE_TTL_MS = 5 * 60 * 1000 // 5 minutes
const nonces = new Map<string, { nonce: string; expiresAt: number }>()
// Simple in-memory nonce store (replace with Redis later)

const verifyBodySchema = z.object({
  address: z.string().min(1),
  message: z.string().min(1),
  signature: z.string().min(1),
})

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
  return c.json({ nonce })
})

// POST /auth/verify -> verifies signature over message containing nonce
auth.post('/auth/verify', async (c) => {
  // need siwe parsing
  const parsed = verifyBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) return c.json({ error: 'invalid body' }, 400)
  const { address, message, signature } = parsed.data
  const addr = normalizeAddress(address)

  const entry = nonces.get(addr)
  if (!entry) return c.json({ error: 'nonce not found' }, 400)
  if (entry.expiresAt < nowMs()) {
    nonces.delete(addr)
    return c.json({ error: 'nonce expired' }, 400)
  }
  if (!message.includes(entry.nonce)) return c.json({ error: 'nonce mismatch' }, 400)

  // Verify signature using viem (Cloudflare Workers/Node ESM compatible)
  try {
    // lazy import to keep worker init light
    const { verifyMessage, getAddress } = await import('viem')
    const recovered = await verifyMessage({
      address: getAddress(addr),
      message,
      signature: signature as Hex,
    })
    if (!recovered) return c.json({ error: 'invalid signature' }, 401)
  } catch (e) {
    return c.json({ error: 'verification failed' }, 500)
  }

  const token = `${addr}:${entry.nonce}` // Placeholder token generation
  nonces.delete(addr) // Consume nonce to prevent replay

  return c.json({ ok: true, token, address: addr })
}) 

// GET /me -> returns authenticated user info
auth.get('/me', (c) => {
  const authz = c.req.header('authorization') || ''
  const [, token] = authz.split(' ')
  if (!token) return c.json({ authenticated: false }, 401)
  const parts = token.split(':')
  if (parts.length !== 2) return c.json({ authenticated: false }, 401)
  const addr = parts[0]
  return c.json({ authenticated: true, address: addr, token })
})

export default auth