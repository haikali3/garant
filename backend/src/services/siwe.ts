import type { ContentfulStatusCode } from "hono/utils/http-status";
import { generateNonce, SiweMessage } from "siwe";
import { getAddress, isHex } from "viem";
import { expiresAt, normalizeAddress, nowMs } from "../lib/helper-auth";
import { getRedisClient } from "../redis";
import type { Env } from "../env";

// Redis TTL for nonces (5 minutes)
export const NONCE_TTL_SECONDS = 5 * 60;

const allowedChains = new Set([1, 8453, 11155111]); // Ethereum Mainnet, Base, Sepolia Testnet
const allowedDomain = "localhost";
const allowedUri = "http://localhost:8787";

type VerifyInput = {
	address: string;
	message: string;
	signature: string;
};

type VerifyResult =
	| { ok: true; token: string; address: string }
	| { ok: false; status: ContentfulStatusCode; error: string };

export const createNonce = async (
	env: Env,
	address: string,
): Promise<{ address: string; nonce: string }> => {
	const addr = normalizeAddress(address);
	const nonce = generateNonce();
	const redis = getRedisClient(env);

	const cacheKey = `nonce:${addr}`;
	await redis.set(cacheKey, nonce, { ex: NONCE_TTL_SECONDS });

	return { address: addr, nonce };
};

export const verifySiwe = async (
	env: Env,
	input: VerifyInput,
): Promise<VerifyResult> => {
	const { address, message, signature } = input;

	if (!isHex(signature)) {
		return { ok: false, status: 400, error: "invalid signature format" };
	}

	const addr = normalizeAddress(address);
	const redis = getRedisClient(env);

	const cacheKey = `nonce:${addr}`;
	const storedNonce = await redis.get<string>(cacheKey);

	if (!storedNonce) return { ok: false, status: 400, error: "nonce not found" };

	let siweMsg: SiweMessage;
	try {
		siweMsg = new SiweMessage(message);
	} catch (err) {
		console.error("verify failed", err);
		return { ok: false, status: 400, error: "invalid siwe message" };
	}

	if (siweMsg.nonce !== storedNonce) {
		return { ok: false, status: 400, error: "nonce mismatch" };
	}
	if (!allowedChains.has(Number(siweMsg.chainId))) {
		return { ok: false, status: 400, error: "chain not allowed" };
	}
	if (
		siweMsg.expirationTime &&
		Date.now() > Date.parse(siweMsg.expirationTime)
	) {
		return { ok: false, status: 400, error: "message expired" };
	}
	if (siweMsg.notBefore && Date.now() < Date.parse(siweMsg.notBefore)) {
		return { ok: false, status: 400, error: "message not valid yet" };
	}
	if (siweMsg.domain !== allowedDomain) {
		return { ok: false, status: 400, error: "invalid domain" };
	}
	if (siweMsg.uri !== allowedUri) {
		return { ok: false, status: 400, error: "invalid uri" };
	}

	const msgAddr = getAddress(siweMsg.address);
	if (msgAddr !== getAddress(addr)) {
		return { ok: false, status: 400, error: "address mismatch" };
	}
	try {
		const { verifyMessage } = await import("viem");
		const recovered = await verifyMessage({
			address: msgAddr,
			message,
			signature,
		});
		if (!recovered)
			return { ok: false, status: 401, error: "invalid signature" };
	} catch (err) {
		console.error("signature verification error", err);
		return { ok: false, status: 500, error: "verification failed" };
	}

	const token = `${addr}:${storedNonce}`;
	await redis.del(cacheKey);

	return { ok: true, token, address: addr };
};
