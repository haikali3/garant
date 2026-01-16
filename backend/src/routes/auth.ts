import { Hono } from "hono";
import { generateNonce, SiweMessage } from "siwe";
import { getAddress, isHex } from "viem";
import { z } from "zod";
import { expiresAt, normalizeAddress, nowMs } from "../helper/auth";

const auth = new Hono();

export const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const nonces = new Map<string, { nonce: string; expiresAt: number }>();
// Simple in-memory nonce store (replace with Redis later)

const verifyBodySchema = z.object({
	address: z.string().min(1),
	message: z.string().min(1),
	signature: z.string().min(1),
});

// POST /auth/nonce -> returns a nonce for a given address
auth.post("/auth/nonce", async (c) => {
	// Accept JSON { address, chainId }.
	const body = (await c.req.json().catch(() => ({}))) as { address?: string };
	// - Validate address format and chainId is allowed.
	const addr = body.address ? normalizeAddress(body.address) : undefined;
	// - Normalize address (e.g., lowercase).
	if (!addr) return c.json({ error: "address required" }, 400);
	// - Generate a random nonce.
	const nonce = generateNonce();
	const now = nowMs();
	// - Upsert auth_nonces for (wallet_address, chain_id):
	nonces.set(addr, { nonce, expiresAt: expiresAt(now, NONCE_TTL_MS) });
	return c.json({ nonce });
});

// POST /auth/verify -> verifies signature over message containing nonce
auth.post("/auth/verify", async (c) => {
	const parsed = verifyBodySchema.safeParse(
		await c.req.json().catch(() => ({})),
	);
	if (!parsed.success) return c.json({ error: "invalid body" }, 400);

	const { address, message, signature } = parsed.data;

	if (!isHex(signature))
		return c.json({ error: "invalid signature format" }, 400);

	// Parse SIWE message
	const addr = normalizeAddress(address);
	const entry = nonces.get(addr);
	if (!entry) return c.json({ error: "nonce not found" }, 400);
	if (entry.expiresAt < nowMs()) {
		nonces.delete(addr);
		return c.json({ error: "nonce expired" }, 400);
	}

	let siweMsg: SiweMessage;
	try {
		siweMsg = new SiweMessage(message);
	} catch (err) {
		console.error("verify failed", err);
		return c.json({ error: "invalid siwe message" }, 400);
	}

	// nonce match
	if (siweMsg.nonce !== entry.nonce) {
		return c.json({ error: "nonce mismatch" }, 400);
	}

	// chain allowlist
	const allowedChains = new Set([1, 8453]); // eth mainnet and base
	if (!allowedChains.has(Number(siweMsg.chainId))) {
		return c.json({ error: "chain not allowed" }, 400);
	}

	// time checks
	if (
		siweMsg.expirationTime &&
		Date.now() > Date.parse(siweMsg.expirationTime)
	) {
		return c.json({ error: "message expired" }, 400);
	}
	if (siweMsg.notBefore && Date.now() < Date.parse(siweMsg.notBefore)) {
		return c.json({ error: "message not valid yet" }, 400);
	}

	if (siweMsg.domain !== "localhost") {
		return c.json({ error: "invalid domain" }, 400);
	}
	if (siweMsg.uri !== "http://localhost:3000") {
		return c.json({ error: "invalid uri" }, 400);
	}

	// Verify signature using viem (Cloudflare Workers/Node ESM compatible)
	const msgAddr = getAddress(siweMsg.address);
	if (msgAddr !== getAddress(addr)) {
		return c.json({ error: "address mismatch" }, 400);
	}
	try {
		// lazy import to keep worker init light
		const { verifyMessage } = await import("viem");
		const recovered = await verifyMessage({
			address: msgAddr,
			message,
			signature,
		});
		if (!recovered) return c.json({ error: "invalid signature" }, 401);
	} catch (err) {
		console.error("signature verification error", err);
		return c.json({ error: "verification failed" }, 500);
	}

	const token = `${addr}:${entry.nonce}`; // Placeholder token generation
	nonces.delete(addr); // Consume nonce to prevent replay

	return c.json({ ok: true, token, address: addr });
});

// GET /me -> returns authenticated user info
auth.get("/me", (c) => {
	const authz = c.req.header("authorization") || "";
	const [, token] = authz.split(" ");
	if (!token) return c.json({ authenticated: false }, 401);
	const parts = token.split(":");
	if (parts.length !== 2) return c.json({ authenticated: false }, 401);
	const addr = parts[0];
	return c.json({ authenticated: true, address: addr, token });
});

export default auth;
