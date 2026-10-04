# Phase 8 release and recovery

Local implementation is complete; deployment approval depends on the unchecked gates below. There is no demo mode. Synthetic accounts and records exist only in isolated test fixtures. Hubtel remains disabled until its merchant contract is supplied and verified; WhatsApp remains disabled.

## Checks available now

Run `npm run check`, `npm run test:browser`, `npm run perf:queries` and `npm run perf:bundle`. The query benchmark creates a fresh in-memory PostgreSQL WASM engine, applies all migrations, seeds 10,000 members, 5,000 care notes and 10,000 ledger entries, then measures queries with the restricted runtime role. It never reads application database environment variables. Repeat measurements on native PostgreSQL staging before sizing the server. Trigram indexes are available, but RLS can prevent their use for substring filters: inspect actual plans rather than assuming index use. Do not make operators leakproof or weaken RLS to improve a benchmark.

The browser suite checks real account forms, keyboard validation, contrast, mobile overflow, anonymous redirects and denied file access. CI additionally checks the native mobile navigation dialog with disposable PostgreSQL accounts. Automated accessibility checks complement a manual screen-reader review; they do not establish screen-reader compatibility by themselves. Dashboard JavaScript has a conservative 512 KiB gzip budget; the measured inventory includes root chunks and client references, including lazy references.

Migration 0014 adds paging/search indexes and statement-scoped identity checks to selected read policies without changing their capabilities or confidentiality rules. It also moves leap-day birthday calculation into bounded SQL pages. Applying new indexes takes locks and resources: back up first and schedule migration on staging, then in a reviewed production maintenance window. Large existing installations may need a separately planned concurrent index rollout.

## Private operational checks

`/operations` is available to pastors and administrators. Counts follow branch and record permissions; payment counts require finance permission. It reports SMS uncertainty/backlog, exhausted delivery reports and failed/stale uploads, with links to the relevant workflows. An unsettled payment is not proof of failure. The page does not claim backups are healthy. Offline attendance queues are local to each enrolled device and must be inspected on that device.

Run `node scripts/ops-check.cjs` from the private maintenance resource every five minutes. It requires `MIGRATION_DATABASE_URL` for `fgc_owner`; do not put this credential in the web or messaging resource. It emits only aggregate JSON and exits 1 for uncertain SMS, queues older than ten minutes, exhausted reports, uploads older than 48 hours or payments pending more than 15 minutes. Configure the existing operations alerting system to alert on exit 1 and on a missing scheduled run; an unconfigured schedule is not monitoring. Investigate uncertain provider results before retrying. Keep disabled Hubtel gates disabled.

Retain the Phase 4 five-minute attendance schedule, Phase 7 daily file cleanup, and independently supervised Phase 6 SMS worker. Use the files-scheduler resource (UID/GID 1001) for commands needing the upload volume. Set explicit job timeouts and alert on failures. Alert separately on external HTTPS uptime, certificate expiry, disk/inode pressure, database availability, worker restarts and off-server backup age. `/health` is web liveness only.

Application operational logs allow only fixed event names, generated request references, selected SQLSTATE codes, roles and status codes. They exclude exception messages, SQL, request bodies, phone numbers and tokens. Restrict log access/retention. Configure proxy/access logging to suppress sensitive callback paths and query strings; application redaction does not sanitize proxy logs or infrastructure tools.

## Independent backup inventory

Agree recovery time and maximum acceptable data loss with the church before pilot. Record backup owner, retention, encryption, restore credentials and last demonstrated recovery date in the private operations inventory, outside Git.

1. PostgreSQL: take engine-aware backups and encrypted off-server copies. Keep role provisioning separately (the four least-privilege roles and credentials), and select point-in-time recovery if the agreed data-loss target requires it. Verify successful backup completion and alert on missing/failed copies.
2. Uploads: back up the private upload volume independently, retaining storage keys and original bytes. For a matched recovery point, pause web writes, messaging and maintenance schedules, complete in-flight work, then capture the PostgreSQL dump and upload snapshot before resuming. Do not assume a live filesystem copy and an unrelated database dump are consistent.
3. Coolify: back up the control-plane database/configuration off-server and preserve its matching `APP_KEY` separately in the password manager. Also preserve the app's stable `AUTH_ENCRYPTION_KEY`, runtime secrets, resource/image digests, domains, mount mappings, worker definitions and schedules. Follow [Coolify instance backup](https://coolify.io/docs/core/backup-and-recovery/instance-backup) and [instance restore](https://coolify.io/docs/core/backup-and-recovery/instance-restore) for the installed version.
4. Hetzner: retain host recovery access, SSH keys, firewall/network definitions, DNS access and attached-volume inventory. [Hetzner server backups/snapshots exclude attached Volumes](https://docs.hetzner.com/cloud/servers/backups-snapshots/overview/); restore their application bytes from the separate upload backup.

## Replacement-host drill

Perform this on a separate host/database/domain with isolated networking and outbound provider delivery blocked. Never import a recovery dump over production. Use synthetic data for ordinary release staging; an approved production-copy recovery drill contains confidential data and needs restricted access and deletion under the church's retention policy.

1. Provision replacement Hetzner host/storage and restore a compatible Coolify instance using the matching backup and `APP_KEY`. Keep application resources, workers and schedules stopped. Check recovered resource definitions before starting any container: restored schedules must not send messages or purge files prematurely.
2. Provision the database roles using `docs/PHASE-2-SETUP.md`. Restore the PostgreSQL backup into a fresh database with its original ownership/grants. Use [Coolify's database restore procedure](https://coolify.io/docs/databases/restore) for the actual dump format; preserve errors instead of treating a partial import as success.
3. Restore the matched upload backup to a fresh private volume mounted at `/app/uploads`, readable by UID/GID 1001 with its original restrictive permissions. Keep database and storage ports private. Restore the matching application encryption key and reviewed secrets.
4. Start a maintenance image matching the backup's migration inventory, using owner credentials and the restored upload mount. Run `node scripts/verify-restore.cjs` as UID 1001. It checks every expected migration checksum and streams every ready file to verify size and SHA-256 digest. Exit 0 confirms these checks only; it does not establish recovery of Coolify, DNS, schedules or business workflows. Missing/altered bytes block release. Never repair metadata merely to make the check pass.
5. Use the runtime role to run `node scripts/db-check.cjs`. Apply later compatible migrations once with the owner maintenance image if upgrading, then verify again with the matching new image. Test an empty database and a restored staging copy. Preserve the restoration log, backup identifiers, image digests, migration inventory and measured recovery time privately.
6. Start the web resource behind staging HTTPS. Check branch separation, member self-service, staff MFA, revoked sessions, confidential care, ledger reconciliation, valid PDFs, original downloads/range seeking and durable attendance queues. Restart/redeploy and confirm records and uploads survive.
7. Restore workers/schedules only after reviewing queue state, approved recipient scope and environment. Enable verified staging delivery deliberately; reconcile uncertain SMS before sending again. Reapply external monitoring and demonstrate a real alert for failure and recovery. Test lost-connectivity attendance sync on an enrolled device.
8. A replacement production cutover needs the matched latest recovery point and the completed gate evidence. Review DNS/proxy/callback endpoints and credentials before changing traffic; record the achieved recovery time/data-loss window. No host or DNS change was performed by this implementation.

## Rollback

Retain immutable digests for the previous and current web, maintenance and messaging images. First test the previous application image against the additive upgraded schema in staging. Roll back application/worker images only when this compatibility test passes; keep database changes and apply reviewed forward fixes. Do not run destructive down-migrations or overwrite production with an old backup to roll back an application bug. A database restore is incident recovery with an explicit data-loss decision.

## Staff-pilot gates

- [ ] Native Linux container CI passes, including migration rerun, restricted roles, persisted upload restart, restored-file verifier and authenticated mobile dialog checks.
- [ ] Empty and restored-copy migrations pass on the selected native PostgreSQL version; performance and server resources are measured there.
- [ ] Coolify staging HTTPS, Secure/HttpOnly/SameSite cookies, MFA and permission tests pass with synthetic records; runtime/worker credentials remain separated.
- [ ] Keyboard and screen-reader review passes directory, care, prayer, attendance/offline sync, ledger and document/media workflows at mobile widths and with reduced motion.
- [ ] PostgreSQL, upload and Coolify backups are restored onto an isolated replacement host; observed recovery time/data loss meets agreed targets.
- [ ] Restart/redeploy, schedules, SMS crash/uncertain-send handling and actual approved mNotify delivery/report reconciliation pass; external alerts and backup-failure alerts are demonstrated.
- [ ] Hubtel merchant contracts and end-to-end checkout/callback/refund checks pass before enabling payments. This deferred integration can remain disabled for a pilot that explicitly excludes online giving.
- [ ] Staff pilot scope, support contact, recovery owner and retained-image rollback are recorded; unresolved dependency advisories are reviewed.

Local tests are evidence for local behavior only. None of these deployment gates is marked passed merely because its procedure or CI job exists.
