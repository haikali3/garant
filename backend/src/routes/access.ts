import { Hono } from "hono";
import { getAddress, isAddress } from "viem";
import { z } from "zod";
import type { Env } from "../env";
import { parseBigIntInput } from "../lib/parse-big-int-input";
import { getViemClient } from "../lib/viem-client";
import { getRedisClient } from "../redis";
import { checkTokenBalance } from "../services/token-checker";

const access = new Hono<{ Bindings: Env }>();

const CACHE_TTL_SECONDS = 30; // Redis uses seconds for set EX

const bodySchema = z
	.object({
		// define the expected body schema here
		address: z.string().min(1),
		chainId: z.number().int(),
		standard: z.enum(["erc20", "erc721", "erc1155"]),
		contract: z.string().min(1),
		tokenId: z.union([z.string().min(1), z.number().int()]).optional(),
		minBalance: z.union([z.string().min(1), z.number().int()]).optional(),
		recheck: z.boolean().optional(),
	})
	.superRefine((data, ctx) => {
		if (!isAddress(data.address)) {
			ctx.addIssue({
				code: "custom",
				path: ["address"],
				message: "invalid address",
			});
		}

		if (!isAddress(data.contract)) {
			ctx.addIssue({
				code: "custom",
				path: ["contract"],
				message: "invalid contract",
			});
		}

		if (data.tokenId !== undefined && parseBigIntInput(data.tokenId) === null) {
			ctx.addIssue({
				code: "custom",
				path: ["tokenId"],
				message: "invalid tokenId",
			});
		}

		if (
			data.minBalance !== undefined &&
			parseBigIntInput(data.minBalance) === null
		) {
			ctx.addIssue({
				code: "custom",
				path: ["minBalance"],
				message: "invalid minBalance",
			});
		}

		if (data.standard === "erc1155" && data.tokenId === undefined) {
			ctx.addIssue({
				code: "custom",
				path: ["tokenId"],
				message: "tokenId required for erc1155",
			});
		}
	});

const invalidBody = (
	c: { json: (data: unknown, status: number) => Response },
	issues: z.core.$ZodIssue[],
) => {
	const details = issues.map((issue) => ({
		path: issue.path,
		message: issue.message,
	}));
	return c.json({ error: "invalid body", details }, 400);
};

// verify ownership or balance of erc20/erc721/erc1155 tokens
access.post("/check", async (c) => {
	// parse json body
	const parsed = bodySchema.safeParse(await c.req.json().catch(() => ({})));

	// validate with zod for address check
	if (!parsed.success) return invalidBody(c, parsed.error.issues);

	// normalized addr
	const { address, chainId, standard, contract, tokenId, minBalance, recheck } =
		parsed.data;

	const normalizedAddress = getAddress(address);
	const contractAddress = getAddress(contract);

	// parse tokenId/minBalance
	const tokenIdValue = tokenId === undefined ? null : parseBigIntInput(tokenId);
	const minBalanceValue =
		minBalance === undefined ? null : parseBigIntInput(minBalance);

	// cache key construction
	const cacheKey = `access_check:${[
		chainId,
		standard,
		contractAddress,
		normalizedAddress,
		tokenIdValue?.toString() ?? "none",
		minBalanceValue?.toString() ?? "none",
	].join(":")}`;

	const redis = getRedisClient(c.env);
	const now = Date.now();

	// 1. Check Redis Cache
	if (!recheck) {
		const cached = await redis.get<{ ok: boolean; balance: string; checkedAt: number }>(cacheKey);
		if (cached) {
			return c.json({
				ok: cached.ok,
				balance: cached.balance,
				cached: true,
				checkedAt: cached.checkedAt,
				chainId,
				standard,
				contract: contractAddress,
				address: normalizedAddress,
				tokenId: tokenIdValue?.toString(),
			});
		}
	}

	const client = getViemClient(c.env, chainId);
	if (!client) return c.json({ error: "rpc not configured" }, 400);

	// 2. Fetch Fresh Data (Blockchain)
	const { ok, balance, error } = await checkTokenBalance(
		standard,
		client,
		contractAddress,
		normalizedAddress,
		tokenIdValue,
		minBalanceValue,
	);

	if (error) {
		return c.json({
			ok: false,
			balance,
			error,
			cached: false,
			checkedAt: now,
			chainId,
			standard,
			contract: contractAddress,
			address: normalizedAddress,
			tokenId: tokenIdValue?.toString(),
		}, 400);
	}

	// 3. Store in Redis with TTL
	const cacheData = {
		ok,
		balance,
		checkedAt: now,
	};

	await redis.set(cacheKey, cacheData, { ex: CACHE_TTL_SECONDS });

	return c.json({
		ok,
		balance,
		cached: false,
		checkedAt: now,
		chainId,
		standard,
		contract: contractAddress,
		address: normalizedAddress,
		tokenId: tokenIdValue?.toString(),
	});
});

export default access;
