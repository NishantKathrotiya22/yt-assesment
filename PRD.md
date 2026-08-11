# PRD — YT Server (Video Platform API)

## 1. Purpose

Backend API for a YouTube-like video platform. This API is the contract that interns will build a
frontend assignment against. There is no frontend in this repository — **this repo is API-only**.

The API must let a client:
- Browse and watch videos, see channel/poster info, likes/dislikes, comments, and recommendations.
- Upload a video (with thumbnail) directly to S3 via presigned URLs, with resumable multipart upload.
- Authenticate with email/password (no signup, no forgot-password) using access + refresh tokens.
- Let an admin inspect view/like/dislike analytics per video, including a views-by-day chart.

## 2. Goals

- Provide a complete, well-documented, predictable REST API an intern can build a React/Vue/etc.
  frontend against without needing backend help.
- Keep video/thumbnail bytes off our server entirely — the client uploads directly to S3 using
  presigned URLs; our server only issues URLs and records metadata.
- Support pausing and resuming a large video upload (multipart).
- Give admins visibility into engagement (views, likes, dislikes, per-day view trend).
- Human-readable error messages with a stable machine-readable error code on every error response.

## 3. Non-Goals (explicitly out of scope)

- No signup flow, no forgot/reset password, no email sending of any kind.
- No video transcoding/processing pipeline (we store whatever file the client uploads).
- No subscriptions, playlists, watch history, notifications, or search.
- No nested/threaded comment replies (flat comments only).
- No multi-channel-per-user (each user account **is** one channel).
- No payments, monetization, or content moderation workflows.
- No real-time features (websockets, live chat).

These may become follow-up phases, but are not part of this assignment's API.

## 4. Users & Roles

Two roles, both created directly via the database/API (no self-registration):

| Role  | Capabilities |
|-------|--------------|
| `USER`  | Login, browse/watch videos, react (like/dislike), comment, upload/manage their own videos, edit their own channel profile. |
| `ADMIN` | Everything a `USER` can do, plus: create new user accounts, view per-video analytics (views, unique viewers, likes, dislikes, views-by-day chart), delete any video/comment. |

Since there's no signup, account creation is always an authenticated, explicit act (see
[Assumptions](#5-assumptions--decisions), item A4).

## 5. Assumptions & Decisions

These are judgment calls made to keep the spec unambiguous. Flag any of these to change direction
before implementation starts.

| # | Decision | Rationale |
|---|----------|-----------|
| A1 | All endpoints require authentication (no anonymous browsing). | Simplest consistent model; matches "email/password auth" being the only entry point described. Easy to relax later if guest browsing is wanted. |
| A2 | A `User` account **is** a channel — no separate `Channel` entity. Fields like `channelName`/`avatarKey` live on `User`. | Request describes "account of poster (Channel)" as one thing, and there's no mention of a user owning multiple channels. |
| A3 | Videos have an optional `category` enum (Music, Gaming, Education, Entertainment, Sports, Technology, News, Other) used only to power recommendations. | "Recommended videos" needs *some* signal beyond pure recency; category is the simplest one that doesn't require ML/search. |
| A4 | No public signup. First `ADMIN` is created by a one-time seed script from env vars. Additional users (any role) are created via an `ADMIN`-only `POST /admin/users` endpoint with an email + password supplied by the admin. | Resolves the chicken-and-egg problem of "no signup" while still satisfying "create accounts directly from the API with a password." |
| A5 | Views are deduplicated per user per video within a rolling 24h window (repeated refreshes within a day don't inflate the count). | Keeps "how many users viewed this video" analytics meaningful. Configurable via env if the assignment wants raw event counts instead. |
| A6 | Video delete is a soft delete (`deletedAt`), excluded from all normal listings. Comment delete is a hard delete. | Preserves historical analytics data (views/likes tied to a video) even if the video is taken down; comments carry no analytics value. |
| A7 | Pagination is offset-based (`page`, `limit`), not cursor-based. | Simpler for interns to consume; dataset sizes for a test app don't need cursor pagination. |
| A8 | Video file itself cannot be replaced after upload (edit covers title/description/thumbnail/category only). Replacing the video means uploading a new one. | Avoids re-triggering the whole multipart flow against an existing published video record. |

## 6. Functional Requirements

### 6.1 Auth
- `POST /auth/login` — email + password → `{ accessToken, refreshToken }`.
- `POST /auth/refresh` — exchange a valid, unexpired, unrevoked refresh token for a new access +
  refresh token pair. The old refresh token is revoked (rotation). Reuse of an already-rotated
  refresh token revokes **all** of that user's refresh tokens (theft/replay protection).
- `POST /auth/logout` — revokes the given refresh token.
- No `/auth/signup`, no `/auth/forgot-password`, no `/auth/reset-password`.

### 6.2 Users / Channels
- `GET /users/me` — my profile.
- `PATCH /users/me` — update my own `channelName` / `avatarKey`. `avatarKey` is an S3 key from the
  avatar presign flow below, not a raw URL — same convention as a video's `thumbnailKey`.
- `GET /users/:id` — public channel profile (name, avatar, video count) of any user.
- `POST /uploads/avatars/presign` — get a presigned URL to `PUT` a new profile picture directly to
  S3 (single-shot, same shape as the thumbnail presign in 6.5). The returned `key` is what you then
  send as `avatarKey` to `PATCH /users/me`.

### 6.3 Videos — Browse & Watch
- `GET /videos` — paginated home page feed (default: most recent first; also supports sort by
  most-viewed). Accepts an optional `search` query param — a case-insensitive partial match against
  `title` and `description` — so the same endpoint powers both the home feed and a search screen.
- `GET /videos/:id` — full detail: title, description, channel/poster info, `viewCount`,
  `likeCount`, `dislikeCount`, `commentCount`, and (if authenticated) the caller's own reaction.
  Calling this endpoint also records a view (see 6.6).
- `GET /videos/:id/recommended` — a list of other videos to show alongside the one being watched.
  Algorithm (kept deliberately simple, see A3): prefer same `category`, ordered by `viewCount` then
  recency, excluding the current video; backfill with globally most-viewed videos if the category
  pool is smaller than the requested page size.
- `GET /videos/mine` — the caller's own uploaded videos (any status).

### 6.4 Videos — Publish
- Publishing is a two-phase flow: **upload the bytes to S3 directly** (6.5), then **finalize the
  metadata record** (this section) once the upload is confirmed complete.
- `POST /videos` — body: `title`, `description`, `category?`, `videoKey` (S3 key from a completed
  upload session), `thumbnailKey` (S3 key from a completed thumbnail presign). Creates the `Video`
  row; it appears on the home feed immediately (no moderation/review step).
- `PATCH /videos/:id` — owner only: edit `title` / `description` / `category` / `thumbnailKey`.
- `DELETE /videos/:id` — owner or admin: soft delete.

### 6.5 Uploads (S3 presigned, multipart, resumable)
The server **never** receives video/thumbnail/avatar bytes — it only talks to S3 to generate
presigned URLs and track upload state. See ARCHITECTURE.md §7 for the full sequence diagram.

**Thumbnail and avatar (single-shot):**
- `POST /uploads/thumbnails/presign` — body: `fileName`, `contentType`. Returns a single presigned
  `PUT` URL + the S3 key the client must use.
- `POST /uploads/avatars/presign` — same request/response shape as the thumbnail presign above, just
  a different S3 prefix. The resulting `key` is passed to `PATCH /users/me` as `avatarKey`.

**Video (resumable multipart):**
- `POST /uploads/videos/initiate` — body: `fileName`, `fileSize`, `contentType`. Validates size
  against `MAX_VIDEO_SIZE_MB`, computes part size/count, calls S3 `CreateMultipartUpload`, and
  persists an `UploadSession` row. Returns `uploadId`, `key`, `partSize`, `totalParts`.
- `POST /uploads/videos/:uploadId/parts/presign` — body: `partNumbers: number[]`. Returns a
  presigned `PUT` URL per requested part number. Called again after a pause/resume for whichever
  parts are still missing.
- `GET /uploads/videos/:uploadId/parts` — calls S3 `ListParts` and returns which part numbers are
  already uploaded (with their ETags), so the client knows exactly what to resume.
- `POST /uploads/videos/:uploadId/complete` — body: `parts: [{ partNumber, eTag }]`. Calls S3
  `CompleteMultipartUpload`. Marks the session `COMPLETED`. Response includes the final `videoKey`
  to pass into `POST /videos`.
- `POST /uploads/videos/:uploadId/abort` — cancels the upload (S3 `AbortMultipartUpload`), marks
  the session `ABORTED`, frees any partial storage.

### 6.6 Views
- Watching a video (`GET /videos/:id`) logs a view event for the authenticated user, subject to the
  24h dedupe rule (A5), and increments the video's denormalized `viewCount`.

### 6.7 Reactions (Like / Dislike)
- `POST /videos/:id/reaction` — body: `type: LIKE | DISLIKE`. Upserts the caller's single reaction
  for that video (a user can only have one active reaction per video; posting the opposite type
  swaps it; counts update accordingly).
- `DELETE /videos/:id/reaction` — removes the caller's reaction (back to neutral).

### 6.8 Comments
- `GET /videos/:id/comments` — paginated, flat list, newest first.
- `POST /videos/:id/comments` — body: `text`. Author is the authenticated user.
- `DELETE /comments/:id` — comment author or admin only.

### 6.9 Admin
- `POST /admin/users` — admin-only. Creates a new account (`email`, `password`, `name`, `role`).
  This is the *only* way accounts are created besides the bootstrap seed script.
- `GET /admin/videos/:id/analytics` — total views, unique viewers, like count, dislike count,
  comment count.
- `GET /admin/videos/:id/views-by-day?from=&to=` — chart-ready array of `{ date, views }` for the
  given date range (defaults to last 30 days).
- `GET /admin/dashboard` — overview counters: total users, total videos, total views platform-wide.

## 7. Non-Functional Requirements

- **Error format:** every error response has a stable `code` (e.g. `VIDEO_NOT_FOUND`), a
  human-readable `message`, and an HTTP status that matches the code. See ARCHITECTURE.md §9 for
  the full error code registry.
- **Validation:** every request body/query/params validated with Joi before hitting a controller's
  business logic; validation failures return `400 VALIDATION_ERROR` with a `details` array of
  per-field problems.
- **Security:** passwords hashed with bcrypt; refresh tokens stored hashed, rotated on every use,
  with reuse detection; access tokens short-lived; role checks enforced via middleware, not ad hoc
  checks in controllers.
- **Consistency:** all list endpoints paginated the same way; all responses use the same success/
  error envelope (ARCHITECTURE.md §6).
- **Performance:** engagement counts (`viewCount`, `likeCount`, `dislikeCount`, `commentCount`) are
  denormalized onto `Video` so the home feed and detail page don't need aggregate queries; detailed
  per-user breakdowns (for admin analytics) live in their own tables.

## 8. Definition of Done (for the API, this phase)

- Every endpoint in §6 implemented, validated, authenticated/authorized per §4, and documented.
- Seed script creates a working bootstrap admin from env vars.
- A Postman/Thunder Client collection or equivalent exists so interns can explore the API without
  reading source code.
- Interns can, end-to-end, using only this API: log in, list videos, watch one (see recommended +
  comments + like/dislike), upload a new video (thumbnail + resumable multipart video), and see it
  appear on the home feed.
