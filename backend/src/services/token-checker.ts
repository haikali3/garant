import {
	type Address,
	erc20Abi,
	erc721Abi,
	erc1155Abi,
	getAddress,
} from "viem";
import type { getViemClient } from "../lib/viem-client";

type ViemClient = NonNullable<ReturnType<typeof getViemClient>>;

// check token balance or ownership for erc20 erc721 or erc1155
export async function checkTokenBalance(
	standard: "erc20" | "erc721" | "erc1155",
	client: ViemClient,
	contractAddress: Address,
	normalizedAddress: Address,
	tokenIdValue: bigint | null,
	minBalanceValue: bigint | null,
): Promise<{ ok: boolean; balance: string; error?: string }> {
	let ok = false;
	let balance = "0";

	try {
		// handle native balance if contract is zero address
		if (contractAddress === "0x0000000000000000000000000000000000000000") {
			const rawBalance = await client.getBalance({ address: normalizedAddress });
			const min = minBalanceValue ?? 1n;
			balance = rawBalance.toString();
			ok = rawBalance >= min;
			return { ok, balance };
		}

		// erc20 check fungible token balance
		if (standard === "erc20") {
			const rawBalance = await client.readContract({
				address: contractAddress,
				abi: erc20Abi,
				functionName: "balanceOf",
				args: [normalizedAddress],
			});
			const min = minBalanceValue ?? 1n;
			balance = rawBalance.toString();
			ok = rawBalance >= min;
		}

		// erc721 check nft ownership
		if (standard === "erc721") {
			if (tokenIdValue !== null) {
				// check ownership of specific token id
				const owner = await client.readContract({
					address: contractAddress,
					abi: erc721Abi,
					functionName: "ownerOf",
					args: [tokenIdValue],
				});
				ok = getAddress(owner) === normalizedAddress;
				balance = ok ? "1" : "0";
			} else {
				// check total nft balance
				const rawBalance = await client.readContract({
					address: contractAddress,
					abi: erc721Abi,
					functionName: "balanceOf",
					args: [normalizedAddress],
				});
				const min = minBalanceValue ?? 1n;
				balance = rawBalance.toString();
				ok = rawBalance >= min;
			}
		}

		// erc1155 check semi fungible token balance
		if (standard === "erc1155") {
			const rawBalance = await client.readContract({
				address: contractAddress,
				abi: erc1155Abi,
				functionName: "balanceOf",
				args: [normalizedAddress, tokenIdValue as bigint],
			});
			const min = minBalanceValue ?? 1n;
			balance = rawBalance.toString();
			ok = rawBalance >= min;
		}
	} catch (error: any) {
		console.error("Token balance check failed:", error);
		return {
			ok: false,
			balance: "0",
			error: error.shortMessage || error.message || "Contract call failed",
		};
	}

	return { ok, balance };
}
