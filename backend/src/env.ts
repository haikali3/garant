import type { AnyD1Database } from "drizzle-orm/d1";

export type Env = {
	GARANT_DB_BINDING: AnyD1Database;
	RPC_URL_MAINNET?: string;
	RPC_URL_BASE?: string;
	RPC_URL_SEPOLIA?: string;
	RPC_URL_BASE_SEPOLIA?: string;
	UPSTASH_REDIS_REST_URL?: string;
	UPSTASH_REDIS_REST_TOKEN?: string;
};
