"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getAddress } from "viem";
import { useAccount, useConnect, useDisconnect, useSignMessage } from "wagmi";
import { createSignMessage, getNonce, verifySignature } from "@/lib/siwe";
import { Button } from "./ui/button";

export function WalletButton({ 
	onAuthSuccess 
}: { 
	onAuthSuccess?: (token: string, address: string, chainId: number) => void 
}) {
	const { address, isConnected, chainId } = useAccount();
	const { connectAsync, connectors, isPending: isConnecting } = useConnect();
	const { disconnect } = useDisconnect();
	const { signMessageAsync, isPending: isSigning } = useSignMessage();

	const [authToken, setAuthToken] = useState<string | null>(null);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const handleConnect = async () => {
		const connector = connectors[0];
		if (!connector) {
			return;
		}
		const data = await connectAsync({ connector });
		const connectedAddress = data.accounts?.[0];
		const connectedChainId = data.chainId;
		if (connectedAddress && connectedChainId) {
			authenticate({ address: connectedAddress, chainId: connectedChainId });
		}
	};

	const handleDisconnect = () => {
		disconnect();
		setAuthToken(null);
	};

	const handleAuthenticate = () => {
		if (address && chainId) {
			authenticate({ address, chainId });
		}
	};

	const {
		mutate: authenticate,
		isPending: isAuthenticating,
		error: authError,
	} = useMutation({
		mutationFn: async ({ address: walletAddress, chainId: walletChainId }: { address: string; chainId: number }) => {
			const nonce = await getNonce(walletAddress);
			const message = await createSignMessage(getAddress(walletAddress), nonce, walletChainId);
			const signature = await signMessageAsync({ message });
			const { token } = await verifySignature(
				walletAddress,
				message,
				signature,
			);

			onAuthSuccess?.(token, walletAddress, walletChainId);
			return { token };
		},
		onSuccess: (data) => {
			setAuthToken(data.token);
		},
	});

	if (!mounted || !isConnected) {
		return (
			<div className="flex flex-col gap-2">
				<Button onClick={handleConnect} disabled={isConnecting || !mounted}>
					{isConnecting ? "Connecting..." : "Connect Wallet"}
				</Button>
			</div>
		);
	}

	if (!authToken) {
		const canAuthenticate = !!address && !isSigning && !isAuthenticating;
		return (
			<div className="flex flex-col gap-2">
				<div className="text-sm text-muted-foreground">
					Connected: <div className="font-mono text-xs">{address}</div>
				</div>
				{(isAuthenticating || isSigning) && (
					<div className="text-sm">Authenticating...</div>
				)}
				{canAuthenticate && (
					<Button onClick={handleAuthenticate}>Authenticate</Button>
				)}
				<Button onClick={handleDisconnect} variant="outline">
					Disconnect
				</Button>
				{authError && (
					<p className="text-destructive text-sm">
						{authError.message || "Authentication failed"}
					</p>
				)}
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			<div className="text-sm font-semibold text-primary">✓ Authenticated</div>
			<div className="text-sm text-muted-foreground">
				Address: <span className="font-mono text-xs">{address}</span>
			</div>
			<div className="text-xs text-muted-foreground">
				Token: <span className="font-mono">{authToken.slice(0, 20)}...</span>
			</div>
			<Button onClick={handleDisconnect} variant="destructive">
				Disconnect
			</Button>
		</div>
	);
}
