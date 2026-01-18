"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, base } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { ThemeProvider } from "next-themes";
import { ReactNode, useMemo } from "react";

const wagmiConfig = createConfig({
	chains: [mainnet, base],
	connectors: [injected()],
	transports: {
		[mainnet.id]: http(),
		[base.id]: http(),
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
