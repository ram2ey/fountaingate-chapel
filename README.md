# Fountain Gate Chapel

Phases 2–5 add PostgreSQL-backed accounts, core church workflows, dated attendance, offline kiosk synchronization, an immutable giving ledger, financial reports and real PDF/CSV exports. Hubtel giving uses GHS and remains disabled until merchant configuration and contract validation are complete. No demo mode or seeded account exists. Messaging campaigns and media integrations remain later phases.

Finance deployment and Hubtel activation: [Phase 5 setup](docs/PHASE-5-SETUP.md).

Read [Phase 2 setup](docs/PHASE-2-SETUP.md), [permission matrix](docs/AUTHORIZATION.md) and [Coolify runbook](docs/COOLIFY.md).

For services, kiosk devices and the attendance maintenance schedule, follow [Phase 4 setup](docs/PHASE-4-SETUP.md).

## Current status

Core screens now persist through authorized server APIs, with confidential care/prayers, retry-safe guest intake, archive/restore, consent, follow-up ownership and transactional audit events. Read [Phase 3 setup and verification](audit/phase-3-results.md) before enabling intake. Authentication requires runtime PostgreSQL and mNotify configuration. See [the implementation plan](IMPLEMENTATION_PLAN.md) for the remaining workflows.

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

Phase 7 provides the confidential document vault, versioned PDF/text originals, published sermon audio, authorized range streaming, saved live status/service schedules and file-retention cleanup. Follow [the documents and media setup](docs/PHASE-7-SETUP.md) for migration 0013, the persistent volume and the private `files-scheduler` resource.

Phase 6 implements SMS broadcasts through mNotify and a durable PostgreSQL outbox. Follow [the SMS and Coolify worker setup](docs/PHASE-6-SETUP.md) to provision the dedicated role, apply migration 0012 and deploy the `messaging-worker` Docker target. Broadcasting defaults disabled; WhatsApp is unavailable. Live provider testing remains a deployment prerequisite.

Use separate domains, PostgreSQL databases/roles and upload volumes for development, staging and production. Tests use synthetic fixtures only inside the test process; no demo switch or runtime fallback exists. Keep provider sandbox/live credentials separate when those integrations are added.

Back up PostgreSQL, upload bytes and Coolify control-plane configuration separately to an off-server destination. Save Coolify's APP_KEY separately in secure recovery storage. Verify restoration onto an isolated environment, including file metadata/bytes consistency. Server snapshots do not replace application backups, and Hetzner snapshots exclude attached Volumes. Detailed backup and release gates are in the implementation plan/runbook.
