import { SiweMessage } from "siwe";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

export async function getNonce(address: string): Promise<string> {
	const res = await fetch(`${API_URL}/auth/nonce`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ address }),
	});

	if (!res.ok) throw new Error("Failed to get nonce");
	const data = (await res.json()) as { nonce: string };
	return data.nonce;
}

export async function createSignMessage(
	address: string,
	nonce: string,
): Promise<string> {
	const msg = new SiweMessage({
		domain: "localhost",
		address,
		statement: "Sign in to Garant",
		uri: "http://localhost:8787",
		version: "1",
		chainId: 1,
		nonce,
	});

	return msg.prepareMessage();
}

export async function verifySignature(
	address: string,
	message: string,
	signature: string,
): Promise<{ token: string; address: string }> {
	const res = await fetch(`${API_URL}/auth/verify`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ address, message, signature }),
	});

	if (!res.ok) {
		const error = (await res.json()) as { error?: string };
		throw new Error(error.error || "Verification failed");
	}

	return (await res.json()) as { token: string; address: string };
}

export async function getMe(token: string): Promise<{ authenticated: boolean; address?: string }> {
	const res = await fetch(`${API_URL}/auth/me`, {
		headers: { Authorization: `Bearer ${token}` },
	});

	if (!res.ok) return { authenticated: false };
	return (await res.json()) as { authenticated: boolean; address?: string };
}
