"use client";

import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { WalletButton } from "@/components/wallet-button";
import { AccessGate } from "@/components/access-gate";
import { Shield, Zap, Globe, Github } from "lucide-react";

export default function Home() {
	const [authState, setAuthState] = useState<{
		token: string;
		address: string;
		chainId: number;
	} | null>(null);

	return (
		<div className="min-h-screen bg-background">
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				{/* Navbar */}
				<div className="flex items-center justify-between mb-2 backdrop-blur-md bg-background/30 p-4 rounded-2xl border border-white/5">
					<div className="flex items-center gap-3">
						<div className="bg-primary p-2 rounded-xl">
							<Shield className="w-6 h-6 text-primary-foreground" />
						</div>
						<div>
							<h1 className="text-xl font-bold tracking-tight">Garant</h1>
							<p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
								Verifiable Intent
							</p>
						</div>
					</div>
					<div className="flex items-center gap-4">
						<ThemeToggle />
						<a href="https://github.com/haikali3/garant" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
							<Github className="w-5 h-5" />
						</a>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
					{/* Left Column: Branding & Flow */}
					<div className="lg:col-span-5 space-y-8 py-4">
						<div className="space-y-4">
							<h2 className="text-4xl font-extrabold tracking-tighter sm:text-5xl">
								The <span className="text-primary">Guarantor</span> of Truth.
							</h2>
							<p className="text-md text-muted-foreground leading-relaxed">
								Garant bridges on-chain ownership with off-chain systems using cryptographic proof. 
								Verify assets, enforce rules, and secure resources instantly.
							</p>
						</div>

						<div className="space-y-6 pt-4">
							<div className="flex gap-4 items-start">
								<div className="mt-1 bg-primary/10 p-2 rounded-lg text-primary">
									<Zap className="w-4 h-4" />
								</div>
								<div>
									<h4 className="font-semibold text-sm regular">No-Session Auth</h4>
									<p className="text-xs text-muted-foreground">Stateless verification using SIWE signatures.</p>
								</div>
							</div>
							<div className="flex gap-4 items-start">
								<div className="mt-1 bg-primary/10 p-2 rounded-lg text-primary">
									<Globe className="w-4 h-4" />
								</div>
								<div>
									<h4 className="font-semibold text-sm">Multi-chain Logic</h4>
									<p className="text-xs text-muted-foreground">Native support for Sepolia, Base, and Mainnet.</p>
								</div>
							</div>
						</div>
					</div>

					{/* Right Column: Interaction */}
					<div className="lg:col-span-7">
						{!authState ? (
							<div className="relative group">
								<div className="absolute -inset-1 bg-primary/20 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
								<div className="relative bg-background border border-white/10 rounded-2xl p-6">
									<div className="mb-4 overflow-hidden rounded-lg bg-muted/50 py-6 flex items-center justify-center text-center">
										<div className="space-y-1">
											<div className="w-8 h-8 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-2">
												<Shield className="w-4 h-4" />
											</div>
											<h3 className="font-bold text-sm">Awaiting Connection</h3>
											<p className="text-[10px] text-muted-foreground max-w-[160px]">Connect Sepolia wallet to begin.</p>
										</div>
									</div>
									<WalletButton 
										onAuthSuccess={(token, address, chainId) => 
											setAuthState({ token, address, chainId }) 
										} 
									/>
								</div>
							</div>
						) : (
							<div className="space-y-6">
								<div className="flex items-center justify-between px-2">
									<div className="flex items-center gap-2">
										<div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
										<span className="text-xs font-mono uppercase tracking-widest opacity-70">Live Verification Session</span>
									</div>
									<button 
										onClick={() => setAuthState(null)}
										className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors"
									>
										Exit Session
									</button>
								</div>
								<AccessGate {...authState} />
							</div>
						)}
					</div>
				</div>

				{/* Footer */}
				<div className="mt-32 pt-12 border-t border-white/5 opacity-50 flex flex-col md:flex-row justify-between items-center gap-4">
					<p className="text-[10px] font-mono uppercase tracking-tighter">
						&copy; 2026 GARANT PROTOCOL // DESIGNED BY DEEPMIND
					</p>
					<div className="flex gap-6">
						<span className="text-[10px] font-mono">STATUS: OPERATIONAL</span>
						<span className="text-[10px] font-mono">VERSION: 0.5.0-ALPHA</span>
					</div>
				</div>
			</div>
		</div>
	);
}
