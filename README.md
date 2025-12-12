# hh.ru parser (standalone)

Base scaffolding for a standalone hh.ru parser app.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 (CSS-first config via `app/globals.css` + `tailwind.config.ts`)
- shadcn/ui primitives (Radix UI) under `components/ui`
- Redis client (`ioredis`) under `lib/redis.ts`
- OpenRouter client with retry/backoff under `lib/openrouter.ts`
- Environment validation via Zod under `lib/env.ts`

## Setup

1. Install dependencies

```bash
npm install
```

2. Create `.env.local`

```bash
HH_API_TOKEN=...
OPENROUTER_API_KEY=...
REDIS_URL=redis://default:password@host:6379

# Optional (only if you plan to use Vercel Blob)
BLOB_READ_WRITE_TOKEN=...
```

3. Run the dev server

```bash
npm run dev
```

## Environment variables

| Name | Required | Description |
| --- | --- | --- |
| `HH_API_TOKEN` | Yes | Token for hh.ru API access |
| `OPENROUTER_API_KEY` | Yes | API key for OpenRouter |
| `REDIS_URL` | Yes | Redis connection string used by `ioredis` |
| `BLOB_READ_WRITE_TOKEN` | No | Vercel Blob read/write token |

## Project primitives

- `lib/env.ts`: validates required environment variables (server-only)
- `lib/http.ts`: small fetch JSON helper with consistent error handling
- `lib/retry.ts`: generic retry/backoff helper
- `lib/redis.ts`: shared Redis client instance
- `lib/openrouter.ts`: thin OpenRouter chat completion helper
