import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load from .dev.vars file
config({ path: ".dev.vars" });

type RequiredEnv = {
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_DATABASE_ID: string;
  CLOUDFLARE_D1_TOKEN: string;
};

const processEnv =
  (
    globalThis as unknown as {
      process?: { env?: Partial<RequiredEnv> };
    }
  ).process?.env ?? {};

const getEnv = (key: keyof RequiredEnv): string => {
  const value = processEnv[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./migrations",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    accountId: getEnv("CLOUDFLARE_ACCOUNT_ID"),
    databaseId: getEnv("CLOUDFLARE_DATABASE_ID"),
    token: getEnv("CLOUDFLARE_D1_TOKEN"),
  },
});
