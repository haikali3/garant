import {
  type Address,
  erc20Abi,
  erc721Abi,
  erc1155Abi,
  getAddress,
} from "viem";
import type { getViemClient } from "../lib/viem-client";

type ViemClient = NonNullable<ReturnType<typeof getViemClient>>;

/**
 * Check token balance/ownership for ERC20, ERC721, or ERC1155
 */
export async function checkTokenBalance(
  standard: "erc20" | "erc721" | "erc1155",
  client: ViemClient,
  contractAddress: Address,
  normalizedAddress: Address,
  tokenIdValue: bigint | null,
  minBalanceValue: bigint | null,
): Promise<{ ok: boolean; balance: string }> {
  let ok = false;
  let balance = "0";

  // ERC20 - Check fungible token balance
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

  // ERC721 - Check NFT ownership
  if (standard === "erc721") {
    if (tokenIdValue !== null) {
      // Check ownership of specific token ID
      const owner = await client.readContract({
        address: contractAddress,
        abi: erc721Abi,
        functionName: "ownerOf",
        args: [tokenIdValue],
      });
      ok = getAddress(owner) === normalizedAddress;
      balance = ok ? "1" : "0";
    } else {
      // Check total NFT balance
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

  // ERC1155 - Check semi-fungible token balance
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

  return { ok, balance };
}
