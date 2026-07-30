# Local development

## Install and verify

```bash
npm install
npm run verify
npm run build
```

## Start

```bash
npm run dev
```

## Local D1

The Wrangler configuration contains a placeholder remote database ID and is intended for local development only until a real database is explicitly created.

```bash
npm run db:migrate:local
npm run db:seed:local
```

Do not replace the placeholder with a remote ID or deploy without an explicit infrastructure decision.
