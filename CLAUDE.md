# CLAUDE.md

This repo is the API-only backend for a YouTube-like video platform, built as the target API for an
intern frontend assignment. There is no frontend here.

## Read these first, every time

- **`PRD.md`** — what the API must do, the roles/permissions model, and every assumption that was
  made to resolve ambiguity in the original requirements. If a request seems to conflict with the
  PRD, say so before implementing — don't silently reinterpret.
- **`ARCHITECTURE.md`** — how the API is built: layering, folder structure, data model, API
  conventions, upload flow, auth/token design, error code registry, env vars, coding standards.

Both are the source of truth for this project. When implementing anything, check them first. When
a real requirement changes during implementation, update the relevant doc in the same change —
don't let them drift out of sync with the code.

## Non-negotiable rules (summarized from ARCHITECTURE.md — that doc wins on any detail)

1. **Layering:** Route → Controller → Service → Repository → DB. Never skip a layer. Controllers
   never touch the DB or S3 directly; only services orchestrate business logic; only repositories
   run queries.
2. **One repository per entity.** A repository only ever queries its own entity. No shared
   "god repository."
3. **Prefer built-in TypeORM `Repository<T>` methods** (`find`, `findOneBy`, `save`, `update`,
   `softDelete`, `increment`/`decrement`) over raw SQL. Use `QueryBuilder` only when a built-in
   truly can't express the query (aggregations, `GROUP BY`).
4. **Every request is Joi-validated** in middleware before it reaches a controller. No inline
   validation logic scattered in controllers/services.
5. **All errors go through the centralized `ApiError` + error-handler middleware.** Every error
   response carries a stable `code` from the registry in `ARCHITECTURE.md` §9 plus a human-readable
   `message`. Don't invent a new error code without adding it to that registry.
6. **Video/thumbnail bytes never pass through this server.** Uploads are presigned-URL flows to S3
   only; the server issues URLs and tracks metadata/state.
7. **No signup, no forgot/reset password, no email sending.** Accounts are created via the seed
   script (bootstrap admin) or the admin-only `POST /admin/users` endpoint.
8. **Clean, minimal code.** No premature abstraction, no speculative config/feature flags, no
   error handling for cases that can't occur. Match the scope of the PRD — don't build ahead of it.

## When something is genuinely unspecified

`PRD.md` §5 lists the assumptions already made to close gaps in the original ask. If you hit a new
gap not covered there, make the smallest reasonable call, add it to that table with a one-line
rationale, and keep moving — don't block on it unless it changes the data model or auth model in a
way that would be expensive to unwind later.
