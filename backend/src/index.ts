import { Hono } from "hono";
import { getDb } from "./db";
import type { Env } from "./env";
import { users } from "./db/schema";

const app = new Hono<{ Bindings: Env }>();

app.get("/", (c) => {
	return c.text("Hello Hono!");
});

app.get("/db/health", async (c) => {
	const db = getDb(c.env);
	await db.select().from(users).limit(1);
	return c.json({ ok: true });
});

export default app;
