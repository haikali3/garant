https://orm.drizzle.team/docs/kit-overview

pnpm drizzle-kit generate
pnpm drizzle-kit migrate
<!-- pnpm drizzle-kit push -->
pnpm drizzle-kit pull
pnpm drizzle-kit check
pnpm drizzle-kit up
pnpm drizzle-kit studio

drizzle-kit generate
lets you generate SQL migration files based on your Drizzle schema either upon declaration or on subsequent changes, see here.

drizzle-kit migrate
lets you apply generated SQL migration files to your database, see here.

drizzle-kit pull
lets you pull(introspect) database schema, convert it to Drizzle schema and save it to your codebase, see here

<!-- drizzle-kit push(this auto push to cloud db, dont use lol) -->
lets you push your Drizzle schema to database either upon declaration or on subsequent schema changes, see here

drizzle-kit studio
will connect to your database and spin up proxy server for Drizzle Studio which you can use for convenient database browsing, see here

drizzle-kit check
will walk through all generate migrations and check for any race conditions(collisions) of generated migrations, see here

drizzle-kit up
used to upgrade snapshots of previously generated migrations, see here

# How to use Drizzle ORM with Cloudflare D1
1. Modify backend/src/db/schema.ts with your new table/column definitions.

2. Run `pnpm drizzle-kit generate --name <migration-name>` to create the migration SQL reflecting those schema edits.
  example: `pnpm drizzle-kit generate --name add-subscriptions-table`

3. Run `pnpm drizzle-kit check` (with your Cloudflare env vars loaded) to confirm the schema and migrations line up.
- usually only check if you have multiple developers working on the same project to avoid migration collisions.
- doesnt check the current state of the database, just the migrations and schema files.
- to check current state  of the database, you can use `pnpm drizzle-kit pull` to see the current schema in Drizzle format.

# connect with d1 first before migrate
4. Run `pnpm drizzle-kit migrate` (still with the Cloudflare vars) to apply the pending migrations to the D1 database.