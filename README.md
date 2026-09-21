# Tavvy Web

Tavvy helps people choose places and services through structured review taps,
recent evidence, useful business information, menus, stories and media.

## Start here

- [Project memory](docs/PROJECT_MEMORY.md): product decisions, architecture and behavior
  that must be preserved across web and mobile.
- [Current engineering status](docs/PROJECT_STATUS.md): verified releases, active work,
  unfinished features and mobile/App Store readiness.
- [Contributor handoff](AGENTS.md): how to continue work while preserving existing changes.
- [Mobile repository](https://github.com/danieldefmartins/tavvy-mobile).

The current development workspace is ahead of committed `main`. Recent production
releases used reviewed source snapshots. Read the status document before building or
deploying; this documentation update does not release unfinished application changes.

## Development

Next.js 14 Pages Router, React 18 and TypeScript, with Supabase shared by the mobile app.
Use Node 20 or later and the existing npm lockfile.

```sh
npm ci
npm run dev
```

Configure the existing project's Supabase connection in an uncommitted local
environment file. Obtain environment settings from the maintainer; never put service
credentials in `NEXT_PUBLIC_*` variables or commit them to this public repository.

```sh
npm run typecheck
npm run build
```

Run the focused behavior/browser tests relevant to the changed feature. A successful
web build does not verify native behavior, database migrations or production state.

## Main application areas

- `/app`: discovery and tools; `/app/place/[id]`: canonical place details.
- `/app/ecard`: card management/creation; `/[username]`: public eCard.
- `/place/[id]/...`: business owner, menu and ordering workflows.
- `components/`, `lib/`, `config/`: UI, data/evidence rules and feature contracts.
- `public/locales/`: translations; `supabase/`: backend migrations and functions.

## Releases

Web production uses the existing Railway project. Deploy reviewed, isolated batches
with their backend dependencies and evidence. Do not initialize a replacement Railway
project or upload a mixed dirty workspace. Mobile EAS builds, Mac Mini producer jobs,
database changes and App Store submission are separate release steps.

Update the project memory and status after each completed batch. Keep customer data,
credentials and private operational runbooks outside Git.
