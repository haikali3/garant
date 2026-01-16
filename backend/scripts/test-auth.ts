/**
 * Test script for the full SIWE authentication flow
 * Run: npx tsx scripts/test-auth.ts
 */

import { SiweMessage } from "siwe";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";

const BASE_URL = process.env.BASE_URL || "http://localhost:8787";

interface NonceResponse {
	nonce?: string;
	error?: string;
}

interface VerifyResponse {
	ok?: boolean;
	token?: string;
	address?: string;
	error?: string;
}

interface MeResponse {
	authenticated: boolean;
	address?: string;
	token?: string;
}

// Test private key - NEVER use in production!
// This is a well-known test key, address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
const TEST_PRIVATE_KEY =
	"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

async function main() {
	// 1. Create wallet from test private key
	const account = privateKeyToAccount(TEST_PRIVATE_KEY);
	const walletClient = createWalletClient({
		account,
		chain: mainnet,
		transport: http(),
	});

	console.log("Wallet address:", account.address);

	// 2. Get nonce from server
	console.log("\n--- Step 1: Get Nonce ---");
	const nonceRes = await fetch(`${BASE_URL}/auth/nonce`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ address: account.address }),
	});
	const nonceData = (await nonceRes.json()) as NonceResponse;
	console.log("Nonce response:", nonceData);

	if (!nonceData.nonce) {
		throw new Error("Failed to get nonce");
	}

	// 3. Create SIWE message
	console.log("\n--- Step 2: Create SIWE Message ---");
	const siweMessage = new SiweMessage({
		domain: "localhost",
		address: account.address,
		statement: "Sign in with Ethereum to Garant",
		uri: "http://localhost:8787",
		version: "1",
		chainId: 1, // mainnet
		nonce: nonceData.nonce,
	});

	const message = siweMessage.prepareMessage();
	console.log("SIWE Message:\n", message);

	// 4. Sign the message
	console.log("\n--- Step 3: Sign Message ---");
	const signature = await walletClient.signMessage({
		message,
	});
	console.log("Signature:", signature);

	// 5. Verify with server
	console.log("\n--- Step 4: Verify Signature ---");
	const verifyRes = await fetch(`${BASE_URL}/auth/verify`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			address: account.address,
			message,
			signature,
		}),
	});
	const verifyData = (await verifyRes.json()) as VerifyResponse;
	console.log("Verify response:", verifyData);

	if (!verifyData.token) {
		throw new Error(`Failed to verify: ${JSON.stringify(verifyData)}`);
	}

	// 6. Test /me endpoint
	console.log("\n--- Step 5: Test /auth/me ---");
	const meRes = await fetch(`${BASE_URL}/auth/me`, {
		headers: {
			Authorization: `Bearer ${verifyData.token}`,
		},
	});
	const meData = (await meRes.json()) as MeResponse;
	console.log("/me response:", meData);

	console.log("\n✅ Full auth flow completed successfully!");
}

main().catch(console.error);
