"use client";

import { useAccount, useConnect, useDisconnect, useSignMessage } from "wagmi";
import { useState } from "react";
import { createSignMessage, getNonce, verifySignature } from "@/lib/auth";
import { getAddress } from "viem";

export function WalletButton() {
	const { address, isConnected } = useAccount();
	const { connect, connectors, isPending: isConnecting } = useConnect();
	const { disconnect } = useDisconnect();
	const { signMessageAsync, isPending: isSigning } = useSignMessage();

	const [isLoading, setIsLoading] = useState(false);
	const [authToken, setAuthToken] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const handleConnect = async () => {
		try {
			setError(null);
			const connector = connectors[0];
			if (!connector) {
				setError("No wallet connector available");
				return;
			}
			connect({ connector });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Connection failed");
		}
	};

	const handleSign = async () => {
		if (!address) return;

		setIsLoading(true);
		setError(null);

		try {
			const nonce = await getNonce(address);
			const message = await createSignMessage(getAddress(address), nonce);

			const signature = await signMessageAsync({
				message,
			});

			const { token } = await verifySignature(address, message, signature);
			setAuthToken(token);
			localStorage.setItem("authToken", token);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Sign-in failed");
		} finally {
			setIsLoading(false);
		}
	};

	const handleDisconnect = () => {
		disconnect();
		setAuthToken(null);
		localStorage.removeItem("authToken");
		setError(null);
	};

	if (!isConnected) {
		return (
			<div className="flex flex-col gap-2">
				<button
					onClick={handleConnect}
					disabled={isConnecting}
					className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
				>
					{isConnecting ? "Connecting..." : "Connect Wallet"}
				</button>
				{error && <p className="text-red-600 text-sm">{error}</p>}
			</div>
		);
	}

	if (!authToken) {
		return (
			<div className="flex flex-col gap-2">
				<div className="text-sm text-gray-600">
					Connected: <span className="font-mono text-xs">{address}</span>
				</div>
				<button
					onClick={handleSign}
					disabled={isLoading || isSigning}
					className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
				>
					{isLoading || isSigning ? "Signing..." : "Sign In"}
				</button>
				<button
					onClick={handleDisconnect}
					className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
				>
					Disconnect
				</button>
				{error && <p className="text-red-600 text-sm">{error}</p>}
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			<div className="text-sm text-green-600 font-semibold">
				✓ Authenticated
			</div>
			<div className="text-sm text-gray-600">
				Address: <span className="font-mono text-xs">{address}</span>
			</div>
			<div className="text-xs text-gray-500">
				Token: <span className="font-mono">{authToken.slice(0, 20)}...</span>
			</div>
			<button
				onClick={handleDisconnect}
				className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
			>
				Disconnect
			</button>
		</div>
	);
}
