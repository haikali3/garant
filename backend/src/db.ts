import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'
import type { Env } from './env'

export const getDb = (env: Env) => {
  return drizzle(env.GARANT_DB_BINDING, { schema })
}
