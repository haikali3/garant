import { Hono } from "hono";
import { erc20Abi, erc721Abi, erc1155Abi, getAddress, isAddress } from "viem";
import { z } from "zod";
import type { Env } from "../env";
import { parseBigIntInput } from "../lib/parse-big-int-input";
import { getViemClient } from "../lib/viem-client";

const access = new Hono<{ Bindings: Env }>();

const CACHE_TTL_MS = 30_000;
const cache = new Map<
	string,
	{ ok: boolean; balance: string; checkedAt: number; expiresAt: number }
>();

const bodySchema = z.object({
	// define the expected body schema here
	address: z.string().min(1),
	chainId: z.number().int(),
	standard: z.enum(["erc20", "erc721", "erc1155"]),
	contract: z.string().min(1),
	tokenId: z.union([z.string().min(1), z.number().int()]).optional(),
	minBalance: z.union([z.string().min(1), z.number().int()]).optional(),
	recheck: z.boolean().optional(),
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
access.get("/check", async (c) => {
	// parse json body
	const parsed = bodySchema.safeParse(await c.req.json().catch(() => ({})));

	// validate with zod for address check
	if (!parsed.success) return invalidBody(c, parsed.error.issues);

	// normalized addr
	const { address, chainId, standard, contract, tokenId, minBalance, recheck } =
		parsed.data;

	if (!isAddress(address)) return c.json({ error: "invalid address" }, 400);
	if (!isAddress(contract)) return c.json({ error: "invalid contract" }, 400);

	const normalizedAddress = getAddress(address);
	const contractAddress = getAddress(contract);

	// parse tokenId/minBalance
	const tokenIdValue = tokenId === undefined ? null : parseBigIntInput(tokenId);
	if (tokenId !== undefined && tokenIdValue === null) {
		return c.json({ error: "invalid tokenId" }, 400);
	}

	const minBalanceValue =
		minBalance === undefined ? null : parseBigIntInput(minBalance);
	if (minBalance !== undefined && minBalanceValue === null) {
		return c.json({ error: "invalid minBalance" }, 400);
	}

	if (standard === "erc1155" && tokenIdValue === null) {
		return c.json({ error: "tokenId required for erc1155" }, 400);
	}

	// cache check (unless recheck)
	const cacheKey = [
		chainId,
		standard,
		contractAddress,
		normalizedAddress,
		tokenIdValue?.toString() ?? "missing tokenIdValue",
		minBalanceValue?.toString() ?? "missing minBalanceValue",
	].join(":");

	const now = Date.now();
	const cached = cache.get(cacheKey);
	if (!recheck && cached && cached.expiresAt > now) {
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

	const client = getViemClient(c.env, chainId);
	if (!client) return c.json({ error: "rpc not configured" }, 400);
	// get viem client for chainId

	let ok = false;
	let balance = "0";

	// do ERC20/721/1155 readContract
	if (standard === "erc20") {
		const rawBalance = await client.readContract({
			address: contractAddress,
			abi: erc20Abi,
			functionName: "balanceOf",
			args: [normalizedAddress],
		});
		const min = minBalanceValue ?? 1n;
		balance = rawBalance.toString();
		ok = rawBalance >= min;
	}

	if (standard === "erc721") {
		if (tokenIdValue !== null) {
			const owner = await client.readContract({
				address: contractAddress,
				abi: erc721Abi,
				functionName: "ownerOf",
				args: [tokenIdValue],
			});
			ok = getAddress(owner) === normalizedAddress;
			balance = ok ? "1" : "0";
		} else {
			const rawBalance = await client.readContract({
				address: contractAddress,
				abi: erc721Abi,
				functionName: "balanceOf",
				args: [normalizedAddress],
			});
			const min = minBalanceValue ?? 1n;
			balance = rawBalance.toString();
			ok = rawBalance >= min;
		}
	}

	if (standard === "erc1155") {
		const rawBalance = await client.readContract({
			address: contractAddress,
			abi: erc1155Abi,
			functionName: "balanceOf",
			args: [normalizedAddress, tokenIdValue as bigint],
		});
		const min = minBalanceValue ?? 1n;
		balance = rawBalance.toString();
		ok = rawBalance >= min;
	}
	// cache + respond

	cache.set(cacheKey, {
		ok,
		balance,
		checkedAt: now,
		expiresAt: now + CACHE_TTL_MS,
	});

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
