import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  driver: 'd1',
  schema: './src/schema.ts',
  out: './drizzle',
  dbCredentials: {
    wranglerConfigPath: './wrangler.jsonc',
    dbName: 'garant_db',
  },
})
