"use client";

import { WalletButton } from "@/components/wallet-button";

export default function Home() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				{/* Header */}
				<div className="mb-12">
					<h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
						Garant
					</h1>
					<p className="text-lg text-gray-600 dark:text-gray-400">
						Web3 trust and access platform
					</p>
				</div>

				{/* Main Card */}
				<div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 max-w-md">
					<div className="mb-6">
						<h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
							Sign In
						</h2>
						<p className="text-gray-600 dark:text-gray-400 text-sm">
							Connect your wallet and sign in using Ethereum.
						</p>
					</div>

					<WalletButton />

					{/* Info Section */}
					<div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
						<h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
							Supported Chains
						</h3>
						<div className="flex gap-2">
							<span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
								Ethereum
							</span>
							<span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
								Base
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
