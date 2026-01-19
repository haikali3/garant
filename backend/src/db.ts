import { drizzle } from "drizzle-orm/d1";
import * as schema from "./db/schema";
import type { Env } from "./env.ts";

export const getDb = (env: Env) => {
	return drizzle(env.GARANT_DB_BINDING, { schema });
};
