# Fountain Gate Chapel

Phase 2 adds PostgreSQL-backed phone accounts, sessions, password recovery/change, staff invitations/MFA, server authorization, branch-scoped RLS and private file/kiosk service foundations. No demo mode or seeded account exists. Most business screens remain unavailable pending Phase 3 and later integrations.

Read [Phase 2 setup](docs/PHASE-2-SETUP.md), [permission matrix](docs/AUTHORIZATION.md) and [Coolify runbook](docs/COOLIFY.md).

## Current status

Phase 1 containment remains in place for unfinished business workflows. Phase 2 enables real registration/sign-in/recovery with runtime PostgreSQL and mNotify configuration, staff authenticator enrollment, protected routes and narrow file/kiosk APIs. See [the implementation plan](IMPLEMENTATION_PLAN.md) for the remaining business workflows.

`GET /health` reports process liveness only. It does not claim database connectivity, authentication readiness or payment/messaging availability.

## Local setup

Use Node.js 24 LTS and npm. Install the exact lockfile:

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`. The current unavailable pages and production build do not require environment variables, provider credentials or a running database. No build contacts production PostgreSQL.

When connecting PostgreSQL, copy `.env.example` to `.env.local` for Next.js locally and replace placeholders. Commands under `scripts/` read process environment only; export variables securely or use Node's `--env-file=.env.local` when running them directly. Do not commit local environment files. Staging and production settings belong in Coolify.

## Checks

```sh
npm run lint
npm test
npm run build
npm run typecheck
npm audit --omit=dev --audit-level=high
```

`npm run check` runs lint, typecheck, tests and build in sequence. Typecheck includes generated Next.js types when they exist. CI builds first, then checks generated types on a clean checkout. The dependency audit is a separate network-backed CI gate; do not fix major upgrades blindly with `--force`.

Tests preserve Phase 1 containment and add clean SQL migrations, actual database roles/RLS, branch/confidentiality checks and real authentication/password handler integration using isolated PostgreSQL engines. No test seed or provider fixture is accessible at runtime.

## PostgreSQL foundation

`lib/server/database.ts` is protected by `server-only`. It lazily opens a shared pool, uses parameterized queries, and provides transaction handling with client release. No browser database client exists. Phase 2 adds a separate identity pool and transaction-local verified session context for RLS.

Required for database commands: a PostgreSQL URL containing host/database/user/password. TLS defaults to `require` with certificate verification; use `DATABASE_CA_BASE64` for a private CA. Set `DATABASE_SSL_MODE=disable` only on a verified trusted private Docker network. Connection-string SSL parameters are rejected so they cannot silently override validation. URL-encode special characters in credentials. Do not log connection strings.

Use a non-owner, non-superuser runtime role without BYPASSRLS. Use a separate owner role for migrations, supplied through `MIGRATION_DATABASE_URL` only to controlled maintenance processes. In a private Coolify network, verify the PostgreSQL resource hostname is reachable from the web/maintenance resource; do not expose port 5432 publicly to make it work.

```sh
npm run db:check
npm run db:migrate
```

`db:check` checks connectivity and rejects elevated/table-owner runtime roles. `db:migrate` applies immutable numbered SQL files once under a dedicated connection/advisory lock, stores checksums and rejects edits to applied files. Phase 2 supplies seven migrations; provision the named owner/data/identity roles first. See [migration conventions](db/migrations/README.md).

Back up before production migrations. The deployment process runs migrations once before compatible web/worker releases, never at each application startup. No live database migration was performed during Phase 1.

## Container deployment

See [the Coolify runbook](docs/COOLIFY.md). The multi-stage Dockerfile builds Next.js standalone output and packages public/static assets. The default final target is the non-root web runner on port 3000; a separate maintenance target contains database commands. `.dockerignore` excludes local secrets, generated files and host dependencies.

```sh
docker build --target runner -t fgc-web:local .
docker run --rm -p 3000:3000 fgc-web:local
docker build --target maintenance -t fgc-maintenance:local .
```

CI builds and smoke-tests the Linux web container without production secrets and verifies migrations against disposable PostgreSQL. Local Windows checks alone do not validate Linux container execution.

## Environment separation and recovery

Use separate domains, PostgreSQL databases/roles and upload volumes for development, staging and production. Tests use synthetic fixtures only inside the test process; no demo switch or runtime fallback exists. Keep provider sandbox/live credentials separate when those integrations are added.

Back up PostgreSQL, upload bytes and Coolify control-plane configuration separately to an off-server destination. Save Coolify's APP_KEY separately in secure recovery storage. Verify restoration onto an isolated environment, including file metadata/bytes consistency. Server snapshots do not replace application backups, and Hetzner snapshots exclude attached Volumes. Detailed backup and release gates are in the implementation plan/runbook.
