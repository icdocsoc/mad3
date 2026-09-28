# Conventions

How code in mad3 is written. Mostly this describes what the code already does, so new code looks
like the old. [CODEMAP.md](./CODEMAP.md) says where things live.

## Formatting

Prettier, with the settings in `.prettierrc`: single quotes, semicolons, no trailing commas,
`arrowParens: avoid`, and Tailwind classes sorted by the plugin. Run `bun run format` before
committing.

## Backend (`hono/`)

- **One Hono app per area** (`auth`, `family`, `admin`), built with `factory.createApp()` from
  `hono/factory.ts` and mounted in `hono/app.ts`. Routes are chained on that app.
- **Guards come first on a route**, in this order: `requireState(...)` if the site state matters,
  then `grantAccessTo(...)`, then `zValidator(...)`, then the handler.
- **Validate every body with Zod** through `zValidator`, and give it a hook that returns a 400
  with a human message when parsing fails.
- **Errors are JSON**: `ctx.json({ error: 'What went wrong, and what to do.' }, status)`, so the
  frontend can always show `error.data.error`. Write the message for the student, not the
  developer.
- **Queries use Drizzle's query builder** (`db.select()…`, `db.insert()…`). Multi-step writes
  go in `db.transaction(async tx => …)`, and are always `await`ed.
- **Anything that depends on today's date is computed when it's needed**, never at import. The
  server runs for months.
- **Shared types and enums live in `hono/types.ts`**; table schemas and their Zod schemas live
  in that area's `schema.ts`.
- **Log with `apiLogger`** at the level that matches what happened. Don't log expected refusals
  (a wrong code, a closed state).

## Database

- Every schema change is a Drizzle migration: edit `schema.ts`, run `bunx drizzle-kit generate`,
  commit the SQL. Never edit a migration that has been released.
- Migrations must be safe on the live database: add with defaults, backfill, then tighten.
- Seed data belongs in `hono/seed.ts`, not in migrations, except rows the app cannot run
  without (like `meta`).

## Frontend (`app/`)

- **Pages are built from the `Card` components**: `Card`, `CardTitle`, `CardText`,
  `CardDetails`.
- **The current user and site state come from `useAuth()` and `useAppState()`**, which the
  global middleware keeps loaded. Don't fetch `/api/family/me` again in a page.
- **Guard pages with `definePageMeta({ middleware: [...] })`**, using `require-auth` and
  `require-admin`.
- **Fetch with `useFetch` for page data and `$fetch` for actions.** Forward `useRequestHeaders()`
  during SSR.
- **Show messages in the page, next to what they're about.** No `alert()` or `confirm()`: they
  block, look broken on phones, and can't be styled.
- **Every flow must work on a phone first**: that's where students open their email.
- **Colours come from the Tailwind theme** (`primary`, `link`, `linkHover` in
  `tailwind.config.js`).

## The survey contract

MaDs is moving onto DoCSoc's new matchmaker, so the survey and its answers match that monorepo
exactly:

- `hono/survey/mads.json` is a copy of `packages/domain/src/survey/schemas/mads.json` in
  [icdocsoc/experimental](https://github.com/icdocsoc/experimental). Change wording there, then
  copy the file here. Never edit this copy on its own.
- Answers are stored in `student.answers`, keyed and shaped as there: a choice is its value (or
  the words typed for a free option), chips are a list of values, a phone is E.164.
- Every answer goes through `readAnswers` (`hono/survey/survey.ts`) before it is stored, so
  nothing the survey couldn't have given gets in.
- The shortcode answer is always the signed-in one.

The Python allocator in `allocations/` is retired: it read the old survey's 27 interest scores,
which new answers don't have.

## Comments

Explain _why_: a constraint, a committee decision, a trap. mad3 already does this well (see the
proposal-revoking comment in `family.ts`). Don't narrate what the code plainly does, and don't
leave notes about the change you just made; that's what the commit message is for.

## Commits and PRs

Conventional prefixes with short lowercase subjects: `feat: …`, `fix: …`, `docs: …`. One
concern per PR, and describe how you tested it.
