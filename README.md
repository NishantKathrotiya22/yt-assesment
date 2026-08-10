# YT Server

API-only backend for a YouTube-like video platform, built as the target API for an intern
frontend assignment. See [`PRD.md`](./PRD.md) for what it does and [`ARCHITECTURE.md`](./ARCHITECTURE.md)
for how it's built. [`CLAUDE.md`](./CLAUDE.md) binds future changes to both.

## Stack

Node.js + TypeScript, Express, TypeORM, PostgreSQL (NeonDB), Joi, JWT auth, AWS S3 (presigned
uploads, resumable multipart video).

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment** — copy the template and fill in real values:
   ```bash
   cp .env.example .env
   ```
   You need:
   - A NeonDB Postgres database — `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct, for migrations).
   - An S3 bucket + IAM credentials with `s3:PutObject`, `s3:CreateMultipartUpload`,
     `s3:UploadPart`, `s3:CompleteMultipartUpload`, `s3:AbortMultipartUpload`, `s3:ListParts` on it.
   - Two long random strings for `ACCESS_TOKEN_SECRET` / `REFRESH_TOKEN_SECRET`.
   - Credentials for the bootstrap admin (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_NAME`).

3. **Run the initial migration**
   ```bash
   npm run migration:run
   ```

4. **Create the bootstrap admin** — this is the only account created outside the API itself:
   ```bash
   npm run seed:admin
   ```

5. **Start the server**
   ```bash
   npm run dev       # hot-reload dev server
   # or
   npm run build && npm start   # compiled prod build
   ```

   Health check: `GET http://localhost:4000/health`.

## Getting more accounts

There's no signup. Once you're logged in as the bootstrap admin, create every other account
(including additional admins) via `POST /api/v1/admin/users` — see [`docs/api.http`](./docs/api.http).

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload (nodemon + ts-node). |
| `npm run build` | Compile TypeScript to `dist/`. |
| `npm start` | Run the compiled build. |
| `npm run typecheck` | Type-check without emitting. |
| `npm run migration:generate -- src/migrations/Name` | Diff entities against the DB and generate a migration. |
| `npm run migration:run` | Apply pending migrations. |
| `npm run migration:revert` | Roll back the last migration. |
| `npm run seed:admin` | Create the bootstrap admin from `SEED_ADMIN_*` env vars (no-op if it already exists). |

## Exploring the API

**Interactive docs**: once the server is running, open **http://localhost:4000/docs** — a full
[Scalar](https://scalar.com) API reference generated from [`docs/openapi.yaml`](./docs/openapi.yaml),
with every endpoint, request/response schema, and a "Try it" panel that can call the running server
directly (set a bearer token via the Authorization button once you've logged in). The raw spec is
also served at `/openapi.json` if you want to import it into Postman/Insomnia/etc.

**Request collection**: [`docs/api.http`](./docs/api.http) is a ready-to-run request collection
(VS Code "REST Client" extension, or JetBrains' built-in HTTP client) covering the full flow:
login → create a video → watch it → react/comment → admin analytics → resumable video upload. Set
the `@baseUrl` and token variables at the top and run requests top to bottom.

Every response follows the same envelope — see `ARCHITECTURE.md` §6 and §9 for the success/error
shapes and the full error code registry. If you change a route's validation or response shape,
update `docs/openapi.yaml` to match — it's hand-maintained, not generated from the Joi schemas.

## What isn't wired up yet

- The video upload flow (`/uploads/videos/*`) needs real AWS credentials to actually move bytes —
  it's been verified end-to-end against a real Postgres database, but the S3 calls themselves need
  your bucket to be reachable.
- No automated test suite yet (out of scope for this pass — see `PRD.md` for what's in/out of scope).
