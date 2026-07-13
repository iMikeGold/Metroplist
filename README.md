# Metroplist

Metroplist is a Next.js static site for Cloudflare Pages. This first build is the public observatory and foundation layer for the future intelligence engine.

## Stack

- Next.js static export
- TypeScript
- Tailwind CSS
- Cloudflare Pages output in `out/`

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Cloudflare Pages settings:

- Build command: `npm run build`
- Build output directory: `out`

Direct deploy:

```bash
npm run deploy:pages
```
