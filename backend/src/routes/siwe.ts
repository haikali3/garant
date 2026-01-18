import { Hono } from "hono";
import { z } from "zod";
import { createNonce, verifySiwe } from "../services/siwe";

const siwe = new Hono();

const verifyBodySchema = z.object({
	address: z.string().min(1),
	message: z.string().min(1),
	signature: z.string().min(1),
});

const nonceBodySchema = z.object({
	address: z.string().min(1),
});

const invalidBody = (
	c: { json: (data: unknown, status: number) => Response },
	issues: z.ZodIssue[],
) => {
	const details = issues.map((issue) => ({
		path: issue.path,
		message: issue.message,
	}));
	return c.json({ error: "invalid body", details }, 400);
};

// POST /auth/nonce -> returns a nonce for a given address
siwe.post("/nonce", async (c) => {
	// Accept JSON { address, chainId }.
	const parsed = nonceBodySchema.safeParse(
		await c.req.json().catch(() => ({})),
	);
	if (!parsed.success) return invalidBody(c, parsed.error.issues);
	const { nonce } = createNonce(parsed.data.address);
	return c.json({ nonce });
});

// POST /auth/verify -> verifies signature over message containing nonce
siwe.post("/verify", async (c) => {
	const parsed = verifyBodySchema.safeParse(
		await c.req.json().catch(() => ({})),
	);
	if (!parsed.success) return invalidBody(c, parsed.error.issues);

	const result = await verifySiwe(parsed.data);
	if (!result.ok) return c.json({ error: result.error }, result.status);
	return c.json({ ok: true, token: result.token, address: result.address });
});

// GET /me -> returns authenticated user info
siwe.get("/me", (c) => {
	const authz = c.req.header("authorization") || "";
	const [, token] = authz.split(" ");
	if (!token) return c.json({ authenticated: false }, 401);
	const parts = token.split(":");
	if (parts.length !== 2) return c.json({ authenticated: false }, 401);
	const addr = parts[0];
	return c.json({ authenticated: true, address: addr, token });
});

export default siwe;
