import { parse } from "dotenv";
import { Hono } from "hono";
import { getAddress, isAddress } from "viem";
import { z } from "zod";
import { parseBigIntInput } from "../helper/parse-big-int-input";

const access = new Hono();

const bodySchema = z.object({
  // define the expected body schema here
  address: z.string().min(1),
	chainId: z.number().int(),
	standard: z.enum(["erc20", "erc721", "erc1155"]),
	contract: z.string().min(1),
	tokenId: z.union([z.string().min(1), z.number().int()]).optional(),
	minBalance: z.union([z.string().min(1), z.number().int()]).optional(),
	recheck: z.boolean().optional(),
});

const invalidBody = (
  c: { json: (data: unknown, status: number) => Response },
  issues: z.core.$ZodIssue[]
) => {
  const details = issues.map((issue) => ({
    path: issue.path,
    message: issue.message,
  }));
  return c.json({ error: "invalid body", details }, 400);
};

// verify ownership or balance of erc20/erc721/erc1155 tokens 
access.get("/check", async (c) => {
  // parse json body
  const parsed = bodySchema.safeParse(await c.req.json().catch(() => ({})));

  // validate with zod for address check
  if (!parsed.success) return invalidBody(c, parsed.error.issues);

  // normalized addr
  const { address, chainId, standard, contract, tokenId, minBalance, recheck } = parsed.data;

	if (!isAddress(address)) return c.json({ error: "invalid address" }, 400);
	if (!isAddress(contract)) return c.json({ error: "invalid contract" }, 400);

  const normalizedAddress = getAddress(address);
  const contractAddress = getAddress(contract);

  // parse tokenId/minBalance
  const tokenIdValue = tokenId === undefined ? null : parseBigIntInput(tokenId);
  if (tokenId !== undefined && tokenIdValue === null) {
    return c.json({ error: "invalid tokenId" }, 400);
  }


  // cache check (unless recheck)
  // get viem client for chainId
  // do ERC20/721/1155 readContract
  // cache + respond




  return c.json({ message: "Learn Access Route is working!" });
});

