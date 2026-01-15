import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
	id: text("id").primaryKey(),
	walletAddress: text("wallet_address").notNull().unique(),
	createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});
