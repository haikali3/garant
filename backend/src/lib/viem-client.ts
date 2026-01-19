import { createPublicClient, http } from "viem";
import { base, type Chain, mainnet } from "viem/chains";
import type { Env } from "../env.ts";

const clients = new Map<number, ReturnType<typeof createPublicClient>>();

export const chainById = new Map<number, Chain>();
chainById.set(1, mainnet);
chainById.set(8453, base);

export const getViemClient = (env: Env, chainId: number) => {
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
