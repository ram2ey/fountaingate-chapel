# Hetzner / Coolify runbook

## Resources

1. A Linux Hetzner server running Coolify, with restricted SSH/management access and the application domain pointing to its public address.
2. A Dockerfile application from the Git repository, internal port `3000`, HTTPS domain and health path `/health`. Use the default final `runner` target or explicitly select `runner`.
3. A PostgreSQL instance with persistent storage and restricted/private connectivity. Web and controlled maintenance resources need network access to the database hostname. Use separate staging and production databases/credentials.
4. A dedicated persistent upload volume mounted at `/app/uploads`, writable by UID/GID `1001:1001`. Phase 2 private PDF APIs use this volume; the document UI follows in Phase 7. Do not put confidential files in `public/`.

Avoid publicly publishing database or internal application ports. Confirm Hetzner/Docker/proxy firewall behavior. Size the server after measuring builds, web/worker memory and database resources; local builds must not exhaust the database host. A single host is a failure domain.

## Configuration

The current image needs no secret to build/start; authentication remains unavailable without runtime configuration. For Phase 2 configure `DATABASE_URL`, `AUTH_DATABASE_URL`, `AUTH_ENCRYPTION_KEY`, `MNOTIFY_API_KEY`, `MNOTIFY_SENDER_ID`, `DATABASE_SSL_MODE`, optional `DATABASE_CA_BASE64`, pool limits, origin and upload path as runtime variables. Keep **Build Variable off** for runtime secrets. The database URL is never public.

Do not provide `MIGRATION_DATABASE_URL` to the normal web application. Use a separately controlled maintenance resource/image and migration owner role. No service database credentials are embedded in the image or copied from `.env.local`.

Coolify variables changed only at runtime require the resource to restart/redeploy so they take effect. Any future `NEXT_PUBLIC_*` setting is compiled into browser code and requires a rebuild. Use separate isolated preview/staging settings; never inject production secrets into untrusted pull-request builds.

## Build and verify

The web image installs the lockfile, builds Next.js standalone output, includes `.next/static` and `public`, runs as non-root, binds to `0.0.0.0:3000` and has a Docker health check. Coolify should route traffic through its HTTPS proxy.

After deployment:

- `GET /health` returns `200`, JSON `{"status":"ok"}` and `Cache-Control: no-store`.
- `/login` and `/kiosk` render their real forms. Without runtime configuration, operations fail safely. `/guest-intake` remains unavailable.
- Protected routes redirect anonymous requests to `/login`; verified accounts need the route capability. Unfinished business workflows remain unavailable; no payment confirmation is simulated.
- Static CSS and `public/manifest.json` load successfully.
- Redeploy/restart does not erase persistent PostgreSQL or upload data.

These are liveness/access smoke checks; real identity, database, SMS and file checks are required by the Phase 2 setup guide. Database readiness is checked privately via the maintenance command; a database outage must not cause endless web liveness restarts.

## Migrations and releases

Require the repository's **Checks** workflow to succeed before deployment. Configure Coolify deployment gating appropriately: its automatic Git push deployment must not bypass CI. Initially deploy approved releases manually after checks, or connect an explicitly authorized CI deployment step later.

Build the maintenance image with `docker build --target maintenance`. Supply migration credentials at runtime and run `node scripts/migrate.cjs` once. The current migration folder has no domain SQL and reports that clearly. `node scripts/db-check.cjs` uses the runtime role and rejects elevated/owner roles. Never execute the removed Supabase schema or migrate on every startup.

Production release sequence: confirm backup/restore viability → apply compatible migrations once → deploy matching application/worker images → verify health and core workflows → enable relevant jobs. Keep the previous image/commit and additive schema compatibility for rollback. Destructive schema changes need a later reviewed migration.

## Workers, schedules and integrations (later phases)

Deploy a separately supervised worker when Phase 6 implements the PostgreSQL outbox. Use durable leases/idempotency and graceful shutdown; web restarts must not lose jobs. Coolify scheduled tasks will run bounded attendance/reminder commands using UTC schedules and explicit church timezone calculations. Their commands must exist in the deployed maintenance/worker image before enabling schedules. Phase 1 does not start pretend workers or schedules.

Configure real payment/messaging callbacks on stable HTTPS endpoints only when implemented. Verify raw-body signatures, allowed proxy behavior, payload limits, duplicate events and test/live separation. Do not enable current unavailable actions just because a container is healthy.

## Backup and host-loss recovery

- Use engine-aware PostgreSQL backups with retention, encryption, alerting and off-server copies. Assess point-in-time recovery against the agreed maximum data-loss target.
- Back up upload-volume bytes separately with a metadata-consistency procedure. Database backups do not include filesystem bytes.
- Back up Coolify's configuration/database and save its APP_KEY separately outside the host. Restrict recovery key access.
- Hetzner server backups/snapshots are an additional infrastructure layer and exclude attached Volumes.
- Restore onto an isolated replacement: PostgreSQL → upload volume → Coolify configuration/secrets → application → verified worker/schedules. Test record permissions, ledger/file consistency and public connectivity before switching DNS/traffic.

Monitor external uptime, disk/resource pressure, TLS renewal, database availability and (once implemented) job backlog/callback failures. Apply reviewed OS/Coolify/database updates and test restoration regularly. Do not publish secrets or confidential note text in logs.

## Verification boundary

No Hetzner/Coolify resource was configured or deployed from this workspace. A Linux Docker engine is required to run the container checks; the committed CI job performs them on Ubuntu. A pending/unrun CI job is not a successful container check.

Phase 2 role provisioning and staging verification: [PHASE-2-SETUP.md](PHASE-2-SETUP.md).
