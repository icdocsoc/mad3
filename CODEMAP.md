# Code Map

Where things live in mad3 and how they fit together. The [README](./README.md) covers running it,
and [CONVENTIONS.md](./CONVENTIONS.md) covers how code here is written.

## The shape of it

One Nuxt 4 app, run on Bun. The frontend is Vue under `app/`. The backend is a Hono app under
`hono/`, mounted inside Nuxt's server at `/api`:

```
browser ──► Nuxt (SSR pages, app/) ──► /api/* ──► hono/index.ts ──► hono/app.ts ──► Postgres
                                                                   └── nodemailer (emails)
                                                                   └── ABC API (is this a DoC student?)
allocations/ (Python) ──── admin cookie ────► /api/admin/allocations/*
generateCsv.ts, mailmerge/ ── admin cookie ─► /api/admin/all-families
```

- `nuxt.config.ts` registers `hono/index.ts` as a server handler for `/api`, which turns the
  Nuxt event into a web `Request` and hands it to Hono.
- Pages fetch from `/api/...` with `useFetch`/`$fetch`, forwarding the browser's cookie during
  SSR (`useRequestHeaders`).

## Backend: `hono/`

| Path                     | What it holds                                                                                                                                                                                                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app.ts`                 | The Hono app: logger, `decodeToken()` on every request, then `/auth`, `/family`, `/admin`.                                                                                                                                                                             |
| `factory.ts`, `types.ts` | `createFactory<Env>()` (context carries `shortcode` and `user_is`); shared types and enums (`stateOptions`, `studentRoles`, `genderOptions`), and the retired allocator's types.                                                                                       |
| `auth/jwt.ts`            | The session: a signed JWT in the `Authorization` cookie (28 days). `decodeToken` reads it; `grantAccessTo(...)` gates routes by role (`fresher`, `parent`, `authenticated`, `unauthenticated`, `admin`, `all`). `isFresherOrParent` reads the entry year off an email. |
| `auth/auth.ts`           | Sign-in routes: email login (`/login`, `/callback-email`), the old Microsoft flow (`/signIn`, `/callback-oauth`), `/signOut`, `/details`. Checks eligibility against the `student` table, then ABC's identity endpoint.                                                |
| `auth/MsApiClient.ts`    | Hand-rolled Microsoft OAuth client, used only by the old Microsoft flow.                                                                                                                                                                                               |
| `auth/schema.ts`         | `auth_tokens` (email login tokens) and request schemas.                                                                                                                                                                                                                |
| `family/family.ts`       | Survey submission, proposals (propose, revoke, accept → marriage), `/me`, `/myFamily`.                                                                                                                                                                                 |
| `family/schema.ts`       | `student`, `proposals`, `marriage`, `family`, and the survey's Zod schema.                                                                                                                                                                                             |
| `admin/admin.ts`         | `requireState(...)`, site state get/set, stats, and all families with both parents' answers (what the matchmaker needs). `/allocations/*` served the retired Python allocator.                                                                                         |
| `admin/schema.ts`        | `meta` (a single row holding the site state) and `states` (OAuth state strings).                                                                                                                                                                                       |
| `mailer.ts`              | `sendEmail`: logs instead of sending outside production.                                                                                                                                                                                                               |
| `logger.ts`              | Request logger and `apiLogger` levels.                                                                                                                                                                                                                                 |
| `seed.ts`                | Pulls this year's freshers from ABC (first-year-only modules), inserts them, and sets the state.                                                                                                                                                                       |
| `README.md`              | Route-by-route API reference.                                                                                                                                                                                                                                          |

### Data model

```
student ── shortcode PK, role (fresher|parent), completed_survey, jmc, name, gender,
           answers (jsonb: every survey answer, keyed as in hono/survey/mads.json),
           interests, socials (the old survey's, kept for past rows)
proposals ─ (proposer, proposee) PK → student
marriage ── id serial, parent1 unique, parent2 unique → student      (a family's two parents)
family ──── kid PK → student, id → marriage                           (a fresher's family)
meta ────── id = 1 (one row), state (app_state enum)
auth_tokens, states ─ sign-in bookkeeping
```

Migrations are in `drizzle/`, generated by drizzle-kit from every `hono/**/schema.ts`.

### Site state

`meta.state` drives what each page offers: `parents_open`, `parents_close`, `freshers_open`,
`closed`. `requireState` guards routes by it, and `app/middleware/02.pageState.global.ts` loads
it for every page.

## Frontend: `app/`

| Path                                           | What it holds                                                                                                   |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `middleware/01.auth.global.ts`                 | Loads `/api/family/me` into `useAuth()` on every navigation.                                                    |
| `middleware/02.pageState.global.ts`            | Loads the site state into `useAppState()`.                                                                      |
| `middleware/requireAuth.ts`, `requireAdmin.ts` | Page guards. Both 404 rather than redirect.                                                                     |
| `pages/index.vue`                              | Landing page and FAQ, worded by site state.                                                                     |
| `pages/portal.vue`                             | The signed-in hub: what to do next, by role and state.                                                          |
| `pages/survey.vue`                             | The survey form.                                                                                                |
| `pages/proposals.vue`                          | Parents pairing up: propose by shortcode, accept, revoke.                                                       |
| `pages/family.vue`                             | Your family once allocated.                                                                                     |
| `pages/admin.vue`                              | Stats, the site state, all families.                                                                            |
| `pages/finish-email.vue`, `finish-oauth.vue`   | Where sign-in links land and complete sign-in.                                                                  |
| `components/`                                  | `Card*` layout pieces, `Student`, `Family`, `EmailPrompt` (the login popup), `navigation/*`, `survey/*` inputs. |
| `composables/`                                 | `useAuth` (current user) and `useAppState` (site state), both `useState`.                                       |
| `utils/`                                       | `interestLabels`, global types.                                                                                 |

## Around the app

| Path                         | What it does                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `allocations/`               | The Python allocator from mad2, **retired**: it read the old survey's 27 interest scores. Families will be matched by DoCSoc's new matchmaker, from `student.answers` and the pairs in `marriage`. |
| `generateCsv.ts`             | Writes `families.csv` from `/api/admin/all-families`, for the mail merge.                                                                                                                          |
| `mailmerge/`                 | Templates and scripts for emailing families their allocations.                                                                                                                                     |
| `Dockerfile`, `compose.yaml` | The production image, and a local Postgres.                                                                                                                                                        |
| `.github/workflows/`         | `nightly` builds `ghcr.io/icdocsoc/mad3:nightly` on `main`, and `release` builds a tagged image from `release/*` branches.                                                                         |

## Known issues

Found while writing this map. Most are addressed on `feat/login-codes-and-survey`; see its PR.

- `academicYear` in `auth/jwt.ts` is computed once, when the server starts.
- A signed-in user's role comes from their email in the JWT but from the database in `/me`, and
  the two can disagree for resitting freshers.
- Sign-in links are consumed by the page's own script as soon as it loads, so anything that
  opens the link first (e.g. mail scanning) uses it up.
- `drizzle.config.ts` has no database credentials and there is no migrate script; `compose.yaml`
  applies migrations through Postgres's first-start scripts, which don't record them.
- Until `meta` has a row, every page fails.
- `acceptProposal` doesn't await its transaction.
