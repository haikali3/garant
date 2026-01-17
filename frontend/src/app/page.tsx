"use client";

import { WalletButton } from "@/components/wallet-button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
	return (
		<div className="min-h-screen">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				{/* Header */}
				<div className="mb-12">
					<h1 className="text-4xl font-bold mb-2">
						Garant
					</h1>
					<p className="text-lg text-muted-foreground">
						Web3 trust and access platform
					</p>
				</div>

				{/* Main Card */}
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle>Sign In</CardTitle>
						<CardDescription>
							Connect your wallet and sign in using Ethereum.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<WalletButton />

						{/* Info Section */}
						<div className="pt-6 border-t border-border">
							<h3 className="text-sm font-semibold mb-3">
								Supported Chains
							</h3>
							<div className="flex gap-2">
								<Badge variant="default">
									Ethereum
								</Badge>
								<Badge variant="secondary">
									Base
								</Badge>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
