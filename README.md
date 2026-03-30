# Personal Hub

Self-hosted personal productivity dashboard for personal use and friends.

## Stack

- **Next.js 15** (App Router) + **React 19** + TypeScript
- **Tailwind CSS** + Lucide React
- **NextAuth.js v5** (credentials, JWT)
- **PostgreSQL 16** (direct SQL via `postgres.js`, no ORM)
- **MinIO** (S3-compatible file storage)
- **Resend** (transactional email)
- **Cloudflare Tunnel** (zero-config HTTPS)
- **Docker** + docker-compose

## Quick Start (local)

```bash
npm install
cp .env.compose.example .env.compose   # fill in values
npm run dev                             # http://localhost:3000
```

## Deployment (Docker / Portainer)

1. Build image via GitHub Actions (push to `main` triggers ghcr.io build)
2. In Portainer → Stacks → Add stack → paste `docker-compose.yml`
3. Set all env vars from `.env.compose.example`
4. Deploy

The `migrate` service runs `migrations/001_init.sql` on first start automatically.

## Environment Variables

See `.env.compose.example` for all required variables.

| Variable           | Description                                |
| ------------------ | ------------------------------------------ |
| `AUTH_SECRET`      | NextAuth secret (random string)            |
| `AUTH_URL`         | Public URL (via Cloudflare Tunnel)         |
| `DATABASE_URL`     | PostgreSQL connection string               |
| `RESEND_API_KEY`   | Resend API key for emails                  |
| `ADMIN_EMAIL`      | First user with this email gets admin role |
| `MAX_ACTIVE_USERS` | Max allowed active users (0 = unlimited)   |

## Commands

```bash
npm run dev           # Dev server
npm run build         # Production build
npm run lint          # ESLint
npm run format        # Prettier
```
