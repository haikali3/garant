import { Hono } from "hono";

const access = new Hono();

// verify ownership or balance of erc20/erc721/erc1155 tokens 
access.get("/check", async (c) => {


  return c.json({ message: "Learn Access Route is working!" });
});

