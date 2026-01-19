import { Hono } from "hono";
import {
	createPublicClient,
	erc20Abi,
	erc721Abi,
	erc1155Abi,
	getAddress,
	http,
	isAddress,
} from "viem";
import type { Chain } from "viem/chains";
import { base, baseSepolia, mainnet, sepolia } from "viem/chains";
import { z } from "zod";
import type { Env } from "../env";

const access = new Hono<{ Bindings: Env }>();

const CACHE_TTL_MS = 30_000;
const cache = new Map<
	string,
	{ ok: boolean; balance: string; checkedAt: number; expiresAt: number }
>();
const clients = new Map<number, ReturnType<typeof createPublicClient>>();

const bodySchema = z.object({
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

const parseBigIntInput = (value: unknown): bigint | null => {
	if (typeof value === "number") {
		if (!Number.isSafeInteger(value) || value < 0) return null;
		return BigInt(value);
	}
	if (typeof value === "string") {
		if (!/^\d+$/.test(value)) return null;
		return BigInt(value);
	}
	return null;
};

const getRpcUrl = (env: Env, chainId: number) => {
	switch (chainId) {
		case 1:
			return env.RPC_URL_MAINNET;
		case 8453:
			return env.RPC_URL_BASE;
		default:
			return undefined;
	}
};

const chainById = new Map<number, Chain>();
chainById.set(1, mainnet);
chainById.set(8453, base);
chainById.set(11155111, sepolia);
chainById.set(84532, baseSepolia);

const getClient = (env: Env, chainId: number) => {
	const existing = clients.get(chainId);
	if (existing) return existing;
	const rpcUrl = getRpcUrl(env, chainId);
	if (!rpcUrl) return null;
	const chain = chainById.get(chainId);
	const client = createPublicClient({
		chain,
		transport: http(rpcUrl),
	});
	clients.set(chainId, client);
	return client;
};

access.post("/check", async (c) => {
	const parsed = bodySchema.safeParse(await c.req.json().catch(() => ({})));
	if (!parsed.success) return invalidBody(c, parsed.error.issues);

	const { address, chainId, standard, contract, tokenId, minBalance, recheck } =
		parsed.data;

	if (!isAddress(address)) return c.json({ error: "invalid address" }, 400);
	if (!isAddress(contract)) return c.json({ error: "invalid contract" }, 400);

	const normalizedAddress = getAddress(address);
	const contractAddress = getAddress(contract);

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

	const cacheKey = [
		chainId,
		standard,
		contractAddress,
		normalizedAddress,
		tokenIdValue?.toString() ?? "",
		minBalanceValue?.toString() ?? "",
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

	const client = getClient(c.env, chainId);
	if (!client) return c.json({ error: "rpc not configured" }, 400);

	let ok = false;
	let balance = "0";

	if (standard === "erc20") {
		const rawBalance = await client.readContract({
			address: contractAddress,
			abi: erc20Abi,
			functionName: "balanceOf",
			args: [normalizedAddress],
		});
		const min = minBalanceValue ?? 1n;
		ok = rawBalance >= min;
		balance = rawBalance.toString();
	} else if (standard === "erc721") {
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
			ok = rawBalance >= min;
			balance = rawBalance.toString();
		}
	} else {
		const rawBalance = await client.readContract({
			address: contractAddress,
			abi: erc1155Abi,
			functionName: "balanceOf",
			args: [normalizedAddress, tokenIdValue ?? 0n],
		});
		const min = minBalanceValue ?? 1n;
		ok = rawBalance >= min;
		balance = rawBalance.toString();
	}

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
