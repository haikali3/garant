import { drizzle } from "drizzle-orm/d1";
import type { Env } from "./env";
import * as schema from "./schema";

export const getDb = (env: Env) => {
	return drizzle(env.GARANT_DB_BINDING, { schema });
};
