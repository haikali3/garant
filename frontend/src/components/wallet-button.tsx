"use client";

import { useAccount, useConnect, useDisconnect, useSignMessage } from "wagmi";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { createSignMessage, getNonce, verifySignature } from "@/lib/auth";
import { getAddress } from "viem";
import { Button } from "./ui/button";

export function WalletButton() {
	const { address, isConnected } = useAccount();
	const { connect, connectors, isPending: isConnecting } = useConnect();
	const { disconnect } = useDisconnect();
	const { signMessageAsync, isPending: isSigning } = useSignMessage();

	const [authToken, setAuthToken] = useState<string | null>(null);
	const [shouldAttemptSign, setShouldAttemptSign] = useState(false);

	const handleConnect = async () => {
		const connector = connectors[0];
		if (!connector) {
			return;
		}
		setShouldAttemptSign(true);
		connect({ connector });
	};

	const handleDisconnect = () => {
		disconnect();
		setAuthToken(null);
		setShouldAttemptSign(false);
		localStorage.removeItem("authToken");
	};

	const { data: nonce } = useQuery({
		queryKey: ["nonce", address],
		queryFn: () => (address ? getNonce(address) : Promise.reject()),
		enabled: !!address && !authToken,
		staleTime: 10000,
	});

	const { mutate: sign, isPending: signMutationPending, error: signError } = useMutation({
		mutationFn: async () => {
			if (!address || !nonce) throw new Error("Missing address or nonce");

			const message = await createSignMessage(getAddress(address), nonce);
			const signature = await signMessageAsync({ message });
			const { token } = await verifySignature(address, message, signature);

			return { token };
		},
		onSuccess: (data) => {
			setAuthToken(data.token);
			localStorage.setItem("authToken", data.token);
		},
	});

	useEffect(() => {
		if (shouldAttemptSign && isConnected && address && nonce && !authToken && !isSigning) {
			setShouldAttemptSign(false);
			sign();
		}
	}, [shouldAttemptSign, isConnected, address, nonce, authToken, isSigning, sign]);

	if (!isConnected) {
	return (
			<div className="flex flex-col gap-2">
				<Button
					onClick={handleConnect}
					disabled={isConnecting}
				>
					{isConnecting ? "Connecting..." : "Connect Wallet"}
				</Button>
			</div>
		);
	}

	if (!authToken) {
		return (
			<div className="flex flex-col gap-2">
				<div className="text-sm text-muted-foreground">
					Connected: <text className="font-mono text-xs">{address}</text>
				</div>
				{(signMutationPending || isSigning) && (
					<div className="text-sm">Authenticating...</div>
				)}
				<Button
					onClick={handleDisconnect}
					variant="outline"
				>
					Disconnect
				</Button>
				{signError && (
					<p className="text-destructive text-sm">
						{signError.message || "Authentication failed"}
					</p>
				)}
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			<div className="text-sm font-semibold text-primary">
				✓ Authenticated
			</div>
			<div className="text-sm text-muted-foreground">
				Address: <span className="font-mono text-xs">{address}</span>
			</div>
			<div className="text-xs text-muted-foreground">
				Token: <span className="font-mono">{authToken.slice(0, 20)}...</span>
			</div>
			<Button
				onClick={handleDisconnect}
				variant="destructive"
			>
				Disconnect
			</Button>
		</div>
	);
}
