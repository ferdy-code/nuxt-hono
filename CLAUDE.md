# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

AI-COS (AI Content OS) is a full-stack content management platform for content creators, with an Indonesian-language UI. Two independent apps in one repo, no shared package/workspace config — each has its own `package.json`, `bun.lock`, and `.env`.

- `frontend/` — Nuxt 3 (Vue 3), served on port 3000
- `backend/` — Hono on Bun, served on port 3001

## Commands

Run from inside `frontend/` or `backend/` respectively (there is no root-level script runner).

```bash
# Backend
bun run dev          # bun --watch src/index.ts
bun run lint         # eslint .
bun run db:generate  # regenerate auth schema via better-auth CLI -> src/db/schema.ts
bun run db:migrate   # drizzle-kit migrate

# Frontend
bun run dev          # nuxt dev
bun run lint         # eslint .
bun run lint:fix
bun run build        # nuxt build
```

Also available: backend `bun run start` (no watch), frontend `bun run generate` / `preview`.

Environment (each app has its own untracked `.env`):
- `backend/.env`: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `FRONTEND_URL` (used for both CORS and better-auth `trustedOrigins`; defaults to `http://localhost:3000`), `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL` (any OpenAI-compatible endpoint)
- `frontend/.env`: `NUXT_PUBLIC_API_URL` (overrides `runtimeConfig.public.apiUrl`, default `http://localhost:3001`)

There is no test suite in either app — do not assume one exists.

Drizzle migrations are generated with `drizzle-kit generate` (schema at `backend/src/db/schema.ts`, migrations output to `backend/drizzle/`) and applied with `db:migrate`. Note: `db:generate` is wired to the **better-auth** CLI, not `drizzle-kit generate` — it regenerates the auth-related tables in schema.ts from better-auth's config, not the app's own tables (content ideas, items, etc.). Hand-edit `schema.ts` for app tables and run `drizzle-kit generate` directly when you need a migration for those.

## Architecture

### Backend (Hono + Drizzle + Postgres)

Single Hono app (`backend/src/index.ts`) mounting one router per feature under `/api/*`:
`settings`, `content/ideas` (`routes/ideas.ts`), `content/items` (`routes/content.ts`), `ai`, `calendar`, `batch`, `export`. Every router applies `authMiddleware` (`backend/src/middleware/auth.ts`) to all its routes except the auth handler itself, which is mounted directly as `app.on(['POST','GET'], '/api/auth/*', c => auth.handler(c.req.raw))`.

- **Auth**: `better-auth` with the Drizzle Postgres adapter (`backend/src/auth.ts`), email+password only. Session/user are injected into Hono context (`c.set('user'/'session')`) by `authMiddleware` and typed via the `Variables` type in `backend/src/types.ts`. Routes read them with `c.get('user')`.
- **DB**: Drizzle ORM over `postgres` client (`backend/src/db/index.ts`), schema in `backend/src/db/schema.ts`. Tables: better-auth's `user`/`session`/`account`/`verification`, plus app tables `userSettings`, `contentIdeas`, `contentItems`, `calendarEvents`, `batchJobs`, `contentComments` — all scoped by `userId` with `onDelete: cascade`. IDs are `crypto.randomUUID()` text primary keys, not serial/uuid columns.
- **AI generation**: `backend/src/services/ai.ts` wraps the `openai` SDK against any OpenAI-compatible endpoint (env vars `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`). Three async generator functions (`generateIdeasStream`, `generateOutlineStream`, `repurposeStream`) yield raw text chunks from `chat.completions.create({ stream: true })` via a shared `streamCompletion` helper. Prompts are hardcoded Indonesian-language templates with per-user `tone`/`style` injected from `userSettings`.
- **Streaming to the client**: AI routes (`backend/src/routes/ai.ts`) use Hono's `stream()` helper to pipe the async generator chunks directly to the HTTP response as they arrive — no SSE framing, no buffering of the full response.
- **Batch jobs**: `backend/src/routes/batch.ts` creates a `batchJobs` row then kicks off `processBatchJob` as fire-and-forget (not awaited in the request handler). Progress is polled by the client via `GET /api/batch/:id`, which reads `completedItems`/`status` updated incrementally by the background job.
- **Notion export**: `backend/src/services/notion.ts` does a minimal hand-rolled Markdown → Notion-blocks conversion (headings, bullets, paragraphs only) and creates a page via `@notionhq/client`. Per-user Notion token + database ID live in `userSettings`, set via the settings page — there is no OAuth flow.
- Error responses use Indonesian messages (e.g. `{ error: 'Tidak diizinkan' }` for 401, `'Tidak ditemukan'` for 404) — keep this consistent when adding routes.

### Frontend (Nuxt 3 + shadcn-vue)

- **Auth guard**: `frontend/middleware/auth.ts` checks a cached `is-authenticated` state, falling back to `authClient.getSession()` (better-auth client, `frontend/lib/auth-client.ts`) on first load; redirects to `/login` if unauthenticated. Pages opt in via `definePageMeta({ layout: 'app', middleware: 'auth' })`.
- **API calls**: `useApi()` composable (`frontend/composables/useApi.ts`) wraps `$fetch` with the backend `baseURL` (from `runtimeConfig.public.apiUrl`) and `credentials: 'include'` so the better-auth session cookie is sent cross-origin.
- **AI streaming on the client**: `useAiStream()` (`frontend/composables/useAiStream.ts`) does a raw `fetch` (not `useApi`/`$fetch`, since it needs the readable stream) directly against `config.public.apiUrl`, reads the response body with a `ReadableStream` reader, and appends decoded chunks into a reactive `streamText` ref. Pages that generate AI content (ide-konten, outline, repurpose, batch) consume this and parse `streamText` once streaming finishes (e.g. stripping ```json fences before `JSON.parse`).
- **Components**: shadcn-vue (`new-york` style, zinc base, no prefix) lives in `frontend/components/ui/*` and is managed via `components.json` / `shadcn-nuxt` module — treat these as generated/vendored, prefer composing them over editing internals. Feature components are grouped by domain (`components/ai`, `components/content`, `components/calendar`, `components/app`) and auto-imported with domain-specific prefixes configured in `nuxt.config.ts` (e.g. everything in `components/ai` is auto-prefixed `Ai*`).
- **Page routes mix Indonesian and English segments**: `ide-konten`, `outline`, `repurpose`, `calendar`, `pengaturan` (settings), `konten` (content list + `[id]` detail/approval view), `batch`. UI copy is Indonesian throughout regardless of the route segment language — match existing pages rather than translating route names.

## Conventions

- ESLint via `@antfu/eslint-config` in both apps (no Prettier) — run `lint`/`lint:fix` rather than hand-formatting to match its style (e.g. no semicolons, single quotes).
- Backend routes always re-fetch the written/updated row from the DB and return that, rather than constructing the response object by hand.
- Mutating routes that touch a row owned by a user always filter by `and(eq(table.id, id), eq(table.userId, user.id))` and return 404 (not 403) when the row doesn't belong to the user or doesn't exist.
