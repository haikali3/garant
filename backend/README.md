```txt
npm install
npm run dev
```

```txt
npm run deploy
```

Drizzle + D1 workflow:

```txt
npm run db:generate
npm run db:migrate:local
```

Make sure `GARANT_DB_BINDING` is configured in `wrangler.jsonc` and the `database_id` is set before remote migrations:

```txt
npm run db:migrate:remote
```

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiation `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```
