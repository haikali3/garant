import type { AnyD1Database } from "drizzle-orm/d1";

export type Env = {
	GARANT_DB_BINDING: AnyD1Database;
	JWT_SECRET: string;
	JWT_ISSUER: string;
	JWT_AUDIENCE: string;
	SESSION_TTL_SECONDS: string;
	NONCE_TTL_SECONDS: string;
	ALLOWED_CHAIN_IDS: string;
	SIWE_DOMAIN: string;
};
