import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { getDb } from "./db";
import { users } from "./db/schema";
import type { Env } from "./env";
import siwe from "./routes/siwe";
import access from "./routes/learn-access";

const app = new Hono<{ Bindings: Env }>();

app.use(logger());
app.use(
	cors({
		origin: "http://localhost:3000",
		credentials: true,
	}),
);
app.get("/", (c) => {
	return c.text("Hello Hono!");
});

app.get("/db/health", async (c) => {
	const db = getDb(c.env);
	await db.select().from(users).limit(1);
	return c.json({ ok: true });
});

app.route("/auth", siwe);
app.route("/access", access);

export default app;
