# Frontend Assignment — Build a YouTube-like Video Platform

## What you're building

A video-sharing web app — think a scoped-down YouTube — built entirely against a backend API
that's already live. Your job is the frontend: browsing, watching, searching, uploading, and
managing a channel. There is no backend work in this assignment; the API is done and documented.

This isn't a toy exercise in isolated components — it's meant to feel like a real product. A user
should be able to land on the home page, click into a video, keep it playing in a mini-player while
they browse or search for something else, and come back to it. That continuity is the core UX
challenge of this assignment, more than any single screen.

## Where the API lives

- **Interactive API docs (Scalar):** `https://yt-assesment.onrender.com/docs` — every endpoint,
  request/response shape, and a "Try it" panel you can use directly. This is the source of truth for
  request/response contracts — this document won't repeat what's already there.
- **Base URL for requests:** `https://yt-assesment.onrender.com/api/v1`
- **Auth:** there's no signup. You'll be given a login (email + password) directly. Every response
  follows a consistent envelope — `{ success, data, meta? }` on success, `{ success: false, error: { code, message, details? } }`
  on failure — so build one shared handler for both, rather than special-casing each call.
- Login gives you an **access token** (short-lived) and a **refresh token** (long-lived). Your Axios
  setup needs to attach the access token to every request and transparently refresh it on a 401
  rather than bouncing the user to login on every expiry — this is expected, not optional polish.

## Tech stack & non-negotiables

| Area | Requirement |
|---|---|
| Framework | **Next.js**, App Router (`app/` directory) — not Pages Router |
| Language | **TypeScript** — `any` is not allowed anywhere. If you don't know a type yet, model it properly (`unknown` + narrowing, generics, discriminated unions) rather than reaching for `any` |
| Server state | **TanStack Query (React Query)** for every API read/write — caching, loading/error states, pagination, invalidation. Don't hand-roll `useEffect` + `useState` data fetching |
| HTTP client | **Axios** — one configured instance (base URL, auth header injection, refresh-on-401 interceptor), not raw `fetch` scattered around |
| Global state | **Redux** (Redux Toolkit) — for cross-cutting app state that isn't server data: auth session, and critically, the **persistent mini-player state** (see below). Don't put server data in Redux — that's React Query's job. Don't put ephemeral local UI state in Redux either — that's `useState`'s job |
| Form handling | **Yup** for schema validation, paired with a form library of your choice (React Hook Form is a natural fit) — every form (login, upload, edit profile) validates before submit with clear inline errors |
| Styling | Your choice, but be consistent across the app |

## Screens to build

### 1. Login
Email + password form, Yup-validated, calls the login endpoint, stores the session, redirects to
Home. Handle invalid-credentials and validation errors distinctly and legibly.

### 2. Home (feed)
Grid of videos, each card showing **thumbnail, title, channel name, view count**. Paginated (the
API supports `page`/`limit`/`sort` — wire up "recent" vs "popular"). This is the landing page after
login.

### 3. Search
A search entry point (header search bar is the natural place) that filters/lists videos matching a
query, shown as a grid consistent with Home. **If a video is currently playing in the mini-player
when the user searches, it must keep playing uninterrupted** — searching is just another kind of
browsing, not a different app state.

### 4. Watch page
Click a video from anywhere (Home, Search, Recommended) and land here. Must show:
- The video player itself, playing the selected video
- Title, description
- Channel name (and it should be a clear link/affordance toward that channel — even if the public
  channel page is a stretch goal, the affordance should exist)
- Like / dislike controls, reflecting the current counts and the viewer's own reaction state
- Comments — list existing comments, and a form to post a new one
- A recommended-videos list/rail (clicking one navigates to that video's watch page)
- **Fullscreen** playback control
- A way to shrink the player into the **mini-player** (see below) and keep browsing

### 5. Mini-player / in-app Picture-in-Picture
This is the feature that ties the app together, not a side quest — read this section carefully.

When a user minimizes the watch page (or simply navigates away while a video is playing), the video
should **not** stop. It should continue in a small, persistent player — commonly docked to a corner
of the screen — that stays mounted **above** your route content while the user navigates anywhere
else in the app (Home, Search, Channel, etc.). Clicking the mini-player expands it back to the full
Watch page.

The engineering implication: the `<video>` element and its playback state cannot live inside a
page/route component, because Next.js will unmount it on navigation and playback will stop. It
needs to live in a layout that persists across routes (e.g. the root layout), with Redux holding
*which* video is active, its play/pause state, and whether it's currently docked as a mini-player
or expanded to the full watch view. Route components read that state and render themselves
accordingly — they don't own the player.

As a stretch addition on top of this (not a replacement for it), you can also wire up the browser's
native Picture-in-Picture API (`video.requestPictureInPicture()`) so the video can float outside the
browser window entirely. But the in-app mini-player described above is the required behavior.

### 6. Channel (my profile)
View your own channel: name, profile picture, and your uploaded videos. An **edit** flow to update
your channel name and profile picture (see the profile-picture upload flow below).

### 7. Upload video
A form: title, description, category, a thumbnail image, and the video file itself. This is where
the presigned-upload and resumable-multipart-upload flows (below) come together — the form should
show real upload progress, and support pausing and resuming a large upload.

Admin-only screens (user management, analytics dashboards) are **out of scope** for this assignment.

## Displaying files: turning an S3 key into a viewable URL

Videos, thumbnails, and profile pictures are **not** returned as ready-to-use URLs. The API returns
raw S3 object *keys* — e.g. `videoKey`, `thumbnailKey`, `avatarKey` — because the server never
serves file bytes itself; S3 does. To actually display one, prefix the key with the asset base URL
you'll be given separately (it follows the pattern `https://<bucket>.<region>.amazonaws.com/<key>`).
Put that base URL in an env var (e.g. `NEXT_PUBLIC_ASSET_BASE_URL`) and build a single small helper
(`resolveAssetUrl(key)`) that every component uses — don't concatenate strings ad hoc in JSX.

## Uploading files

### Profile picture & thumbnail (single presigned upload)

Both follow the same simple flow:

1. Ask the API for a presigned upload URL for the file you're about to send (you tell it the file
   name and content type).
2. The API hands back a one-time `url` and the `key` that file will live at once uploaded.
3. `PUT` the raw file bytes directly to that `url` — this goes straight to S3, not through the API.
4. Use the returned `key` as `thumbnailKey` (when creating a video) or `avatarKey` (when updating
   your profile).

There's no separate "confirm" step for these — once the `PUT` succeeds, the key is valid and usable.

### Video (resumable multipart upload)

Videos are uploaded in chunks so a large file can survive a pause, a dropped connection, or a
deliberate "pause upload" click from the user, without starting over. The shape of it:

1. **Start** — tell the API the file's name, size, and content type. It responds with an upload
   session id, the target S3 key, the **part size**, and the **total number of parts** — the client
   doesn't decide chunk size, the server does; always read it from the response.
2. **Upload parts** — for each part, ask the API for a presigned URL for that specific part number,
   then `PUT` that slice of the file directly to S3. Each successful `PUT` returns an `ETag` in the
   response headers — **hang on to it**, keyed by part number; you need every one of them later.
   Upload parts sequentially (or with limited concurrency) so you can cleanly stop between parts.
3. **Pause** — simply stop requesting/uploading the next part. If a part is mid-transfer when the
   user pauses, abort that in-flight request (`AbortController`) rather than letting it finish —
   pausing should be immediate, not "finish this chunk then stop."
4. **Resume** — ask the API which parts it already has on record for this upload session (it checks
   directly against S3, so this is authoritative even if your local state got out of sync). Skip
   those, and continue uploading whatever's missing.
5. **Complete** — once every part is uploaded, send the API the full list of `{ partNumber, eTag }`
   pairs. It finalizes the object on S3 and hands you back the final `videoKey`.
6. **Publish** — call the create-video endpoint with that `videoKey`, the `thumbnailKey` from the
   thumbnail upload, and the title/description/category from the form.

A couple of things worth building deliberately rather than as an afterthought:
- **Progress UI** should reflect parts completed vs. total, not just a spinner.
- **Resume must survive the user closing and reopening the upload panel within the same session** —
  keep enough state (upload id, key, part size/count, which parts are done) to pick back up. Full
  resume across a browser restart isn't realistic (the browser doesn't retain the original file
  handle across a reload), so don't over-engineer for that case — resuming within the same session
  after a pause is the real requirement.
- **Size limits**: the API enforces a maximum video file size and a fixed part size server-side (both
  configurable on the backend, so don't hardcode assumptions — read `partSize` and `totalParts` from
  the initiate response every time, and surface the API's error message if a file is rejected for
  being too large rather than failing silently).

## Engineering standards

This is graded as much on how the codebase is built as on what it does.

**Project structure** — organize by feature, not by file type. Something like:
```
app/                     # routes (App Router)
  (auth)/login/
  (main)/
    page.tsx             # home
    search/
    watch/[id]/
    channel/
    upload/
components/              # shared, reusable UI
features/                # feature-scoped logic: api hooks, slices, types, feature-local components
  video/
  auth/
  player/                # the persistent mini-player lives here
  channel/
store/                    # redux store setup
lib/                       # axios instance, resolveAssetUrl, other cross-cutting utilities
```
Treat this as a starting point, not a mandate — but "everything in one giant `components/` folder"
or logic embedded directly in page files is not acceptable at this scope.

**Git** — work in feature branches (`feature/watch-page`, `feature/upload-flow`, ...), not directly
on `main`. Commit frequently and in logical, reviewable chunks — not one commit per day dumping
everything. Write commit messages that say *why*, not just *what* (`fix: retry token refresh on
concurrent 401s` beats `fix bug`).

**Code quality** — no `any`, no dead code, no commented-out blocks left behind, no console.logs in
committed code. Extract reusable logic into hooks rather than duplicating it across components.
Keep components focused — if a component is doing data-fetching, business logic, *and* rendering,
it's doing too much.

## Definition of done

- [ ] All 7 screens above are built and navigable
- [ ] Login persists across a refresh; expired access tokens refresh transparently
- [ ] A video keeps playing in the mini-player through navigation and search, with no interruption
- [ ] Fullscreen playback works
- [ ] Thumbnail and profile picture uploads work end to end (presign → PUT → key used)
- [ ] Video upload works end to end, including pausing mid-upload and resuming it successfully
- [ ] No `any` in the codebase; forms are Yup-validated with visible error states
- [ ] Reasonable feature-based project structure; a real git history with meaningful commits across
      multiple branches, not a single initial commit
