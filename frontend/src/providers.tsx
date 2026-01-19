"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { type ReactNode, useMemo } from "react";
import { createConfig, http, WagmiProvider } from "wagmi";
import { base, mainnet, sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

const wagmiConfig = createConfig({
	chains: [mainnet, base, sepolia],
	connectors: [injected()],
	transports: {
		[mainnet.id]: http(),
		[base.id]: http(),
		[sepolia.id]: http(),
	},
});

export function Providers({ children }: { children: ReactNode }) {
	const queryClient = useMemo(() => new QueryClient(), []);

	return (
		<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
			<WagmiProvider config={wagmiConfig}>
				<QueryClientProvider client={queryClient}>
					{children}
				</QueryClientProvider>
			</WagmiProvider>
		</ThemeProvider>
	);
}
