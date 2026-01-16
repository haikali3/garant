
import { Hono } from 'hono'
import { z } from 'zod'
import { nowMs, expiresAt, normalizeAddress } from '../helper/auth'
import { generateNonce } from 'siwe'

// Simple in-memory nonce store (replace with Redis later)
const NONCE_TTL_MS = 5 * 60 * 1000
const nonces = new Map<string, { nonce: string; expiresAt: number }>()

const verifyBodySchema = z.object({
  address: z.string().min(1),
  message: z.string().min(1),
  signature: z.string().min(1),
})

export const auth = new Hono()

// POST /auth/nonce -> returns a nonce for a given address
auth.post('/auth/nonce', async (c) => {
  const body = await c.req.json().catch(() => ({})) as { address?: string }
  const addr = body.address ? normalizeAddress(body.address) : undefined
  if (!addr) return c.json({ error: 'address required' }, 400)

  const nonce = generateNonce()
  const now = nowMs()
  nonces.set(addr, { nonce, expiresAt: expiresAt(now, NONCE_TTL_MS) })

  return c.json({ nonce })
})

// POST /auth/verify -> verifies signature over message containing nonce
// Expected message format is flexible; here we just require that the message includes the exact nonce.
auth.post('/auth/verify', async (c) => {
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
    // Lazy import to keep worker init light
    const { verifyMessage, getAddress } = await import('viem')
    const recovered = await verifyMessage({
      address: getAddress(addr),
      message,
      signature,
    })
    if (!recovered) return c.json({ error: 'invalid signature' }, 401)
  } catch (e) {
    return c.json({ error: 'verification failed' }, 500)
  }

  // Issue a simple session token (placeholder). In production, set HttpOnly cookie/JWT.
  const token = `${addr}:${entry.nonce}`
  nonces.delete(addr)
  return c.json({ ok: true, address: addr, token })
})

// GET /me -> returns minimal session info from Bearer token
auth.get('/me', (c) => {
  const authz = c.req.header('authorization') || ''
  const [, token] = authz.split(' ')
  if (!token) return c.json({ authenticated: false }, 401)
  const parts = token.split(':')
  if (parts.length !== 2) return c.json({ authenticated: false }, 401)
  const addr = parts[0]
  return c.json({ authenticated: true, address: addr })
})

export default auth
