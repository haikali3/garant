import {
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
	id: text("id").primaryKey(),
	createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const wallets = sqliteTable(
	"wallets",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		address: text("address").notNull(),
		chainId: integer("chain_id").notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
	},
	(table) => [
		uniqueIndex("wallets_address_chain_id").on(table.address, table.chainId),
	],
);

// auth nonces for wallet authentication (flow: nonce + signature -> JWT)
// one nonce per wallet address
// nonce is a random string stored in the database and sent to the client
// client signs the nonce with their wallet and sends the signature back to the server
// server verifies the signature and issues a JWT if valid
export const auth_nonces = sqliteTable("auth_nonces", {
	id: text("id").primaryKey(),
	nonce: text("nonce").notNull(),
	walletAddress: text("wallet_address").notNull(),
	chainId: integer("chain_id").notNull(),
	createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
	expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
	consumedAt: integer("consumed_at", { mode: "timestamp_ms" }),
}, (table) => [
	uniqueIndex("auth_nonces_wallet_chain").on(table.walletAddress, table.chainId),
]);

export const sessions = sqliteTable("sessions", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	jti: text("jti").notNull().unique(), // JWT ID for identifying the session
	createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
	expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
	revokedAt: integer("revoked_at", { mode: "timestamp_ms" }),
});

export const access_rules = sqliteTable("access_rules", {
	id: text("id").primaryKey(),
	name: text("name"),
	ruleType: text("rule_type").notNull(), // e.g. erc20,erc721,erc1155
	contractAddress: text("contract_address").notNull(),
	chainId: integer("chain_id").notNull(),
	tokenId: text("token_id"), // optional, only for erc1155 and erc721
	minBalance: text("min_balance"), // in wei, WEI = smallest unit of the token
	createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

// attach access rules to resources/actions for authorization
export const access_assignments = sqliteTable("access_assignments", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	accessRuleId: text("access_rule_id")
		.notNull()
		.references(() => access_rules.id, { onDelete: "cascade" }),
	assignedAt: integer("assigned_at", { mode: "timestamp_ms" }).notNull(),
});

// tracked on-chain contracts for event indexing
export const contracts = sqliteTable("contracts", {
	id: text("id").primaryKey(),
	address: text("address").notNull(),
	chainId: integer("chain_id").notNull(),
	type: text("contract_type").notNull(), // e.g. erc20, erc721, erc1155
	createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [
	uniqueIndex("contracts_address_chain_id").on(table.address, table.chainId),
]);

export const events = sqliteTable(
	"events",
	{
		id: text("id").primaryKey(),
		contractId: text("contract_id")
			.notNull()
			.references(() => contracts.id, { onDelete: "cascade" }),
		eventType: text("event_type").notNull(), // e.g. Transfer, Approval, etc.
		txHash: text("tx_hash").notNull(),
		logIndex: integer("log_index").notNull(),
		blockNumber: integer("block_number").notNull(),
		payload: text("payload").notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
	},
	(table) => [
		uniqueIndex("events_tx_hash_log_index").on(table.txHash, table.logIndex),
	],
);
