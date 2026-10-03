# Fountain Gate Chapel implementation plan

Based on the 3 October 2026 audit. This plan covers all 25 findings in `AUDIT.md` and separates necessary repairs from optional product expansion. No production changes are authorized or performed by this document.

## Intended result

A church management application with verified sign-in, enforced permissions, durable records, accurate attendance and giving, genuine file downloads, reliable integrations, and a repeatable release process. Preserve the existing visual direction while replacing prototype behavior incrementally.

## Working decisions

- Keep Next.js and use a PostgreSQL instance as the database. Remove Supabase dependencies and assumptions from the application implementation. Select supported patched dependency versions at implementation time using current advisories; do not assume the historical audit's suggested versions remain sufficient.
- Host the Next.js application on a Hetzner Linux server, with Coolify managing Docker deployments, domains, HTTPS and application configuration. Use the Dockerfile deployment path. Do not depend on Vercel runtime services or Vercel Cron.
- Access PostgreSQL only from trusted web/worker server code through a pooled, parameterized SQL data layer. Use a private connection URL, separate migration/runtime roles and versioned SQL migrations. Browsers call authenticated application endpoints; they never connect directly to PostgreSQL.
- Retain phone/password sign-in initially. Implement application-owned identity and revocable database-backed sessions using reviewed authentication/password libraries, verify phone ownership during registration or invitations, and configure the required SMS service. OTP-only sign-in is an alternative product decision, not a mock fallback.
- Store uploaded files in a dedicated persistent volume outside the web container image, behind authorized application download routes. Store file metadata in PostgreSQL. Use a storage adapter so external object storage can be added later without rewriting permissions; no Supabase service is required.
- Keep three top-level roles, but express capabilities separately: user administration, finance, broadcasting, member administration, pastoral care and confidential care. Admin status alone must not grant confidential counseling access. Roles and branch memberships are server-controlled.
- Use one payment provider initially, chosen after confirming the church's merchant account and enabled currency/payment methods. Enable only methods that can actually be processed.
- Store monetary values using explicit currency and decimal-safe values or currency-aware minor units. Aggregate per currency initially; currency conversion is an optional later feature.
- Use Africa/Accra for church service/calendar dates and UTC for event/audit timestamps. Branch timezone becomes configurable with branch management.
- Do not implement a demo mode. Remove seeded records and mock authentication from the application runtime; use real database records and honest empty states. Synthetic fixtures belong only in automated tests. If a deployed database already contains real records, inventory, back up and map them before applying migrations.
- Keep general application state small. Put trusted reads/writes in server services and database policies; use feature-specific client data caches for interactive screens.

## Hetzner and Coolify deployment architecture

Planned request flow: users → application domain over HTTPS → Coolify reverse proxy → Next.js web container → private PostgreSQL instance. The application owns authentication, authorized APIs and file access. PostgreSQL persists accounts, sessions, church records and outbox jobs; file bytes live on a protected persistent upload volume. A separately supervised worker consumes durable jobs. Coolify scheduled tasks invoke bounded job commands for attendance calculations, reminders and maintenance.

This is a deployment design, not a configured server. Confirm the domain, server architecture/resources, installed Coolify version and PostgreSQL instance location/version before infrastructure implementation. A PostgreSQL resource managed by Coolify is the initial deployment assumption; an existing reachable PostgreSQL instance can be used instead. Choose server capacity after measuring the production image, builds, database, worker concurrency and expected traffic; do not lock in a server size without that evidence.

### Build and container deliverables

- Add a multi-stage `Dockerfile`, `.dockerignore` and reproducible container build. Use a supported Node version compatible with the upgraded Next.js version and the selected Hetzner CPU architecture.
- Configure Next.js standalone output; package its runtime together with `public` and static assets. Run as a non-root user, listen on `0.0.0.0`, and route the internal application port through Coolify. Keep member records and uploads outside the replaceable web container.
- Exclude `.env.local`, credentials, host `node_modules`, `.next`, local audit artifacts and unnecessary files from the Docker build context. Use the lockfile for dependency installation.
- Add a lightweight `/health` liveness endpoint that discloses no configuration/secrets. Monitor database readiness separately so a PostgreSQL outage does not create a web-container restart loop.
- Test startup, proxy headers, secure session cookies, server actions, static assets and graceful termination inside the production Linux container. Do not select a static-export deployment: the planned server authentication, mutations and webhooks require a server runtime.
- Retire `vercel.json` when adding the container deployment configuration, and replace Vercel-specific instructions in project requirements/runbooks. Removed during Phase 1.

Coolify supports the [Dockerfile path for Next.js](https://coolify.io/docs/applications/framework-examples/javascript/nextjs). The container and runtime checks follow the [Next.js self-hosting guidance](https://nextjs.org/docs/app/guides/self-hosting).

### Configuration and environment separation

| Configuration | Coolify scope |
|---|---|
| `DATABASE_URL`, worker database credentials and authentication secrets | Runtime only; never browser-exposed or Docker build arguments |
| Payment/messaging secrets and webhook signing secrets | Runtime only; never browser-exposed or Docker build arguments |
| Upload volume path and validated file limits | Runtime configuration; persist actual bytes in the mounted volume |
| Canonical application origin, auth callback settings and provider webhook URLs | Environment-specific runtime configuration; rebuild if a browser-public equivalent is compiled into the bundle |
| Migration credentials | Dedicated controlled migration task/CI secret scope; do not distribute to browser clients or general web/worker code |

The initial application should use same-origin APIs and need no public database configuration. `NEXT_PUBLIC_*` values, if added, are compiled into browser bundles. Build separate images when browser-public values differ, unless a deliberate runtime-public-configuration mechanism is implemented and tested. Server-only secrets should be validated at runtime without requiring them during static compilation. Configure explicit staging/production domains, separate PostgreSQL databases and runtime roles, separate upload volumes, callback allowlists and payment/messaging test/live modes. A browser-rendered page must never open a database connection or execute database queries during an unauthorized build/render path.

Coolify documents the independent [build and runtime variable settings](https://coolify.io/docs/applications/configuration/environment-variables). Keep preview deployments isolated from production data and secrets.

### Deployment and migration sequence

1. CI checks source, dependency advisories and the production container before a release is eligible for deployment. Coolify deployments must be gated by successful checks, rather than deploying every pushed commit regardless of CI outcome.
2. Deploy to staging, apply reviewed migrations once through a controlled runner, and execute permission/integration smoke checks.
3. Before production changes, verify a usable backup and run backward-compatible, additive migrations once. Do not run migrations from every web/worker container startup.
4. Deploy the matching web and worker release through Coolify, check health and smoke-test login, persisted writes, callback URLs and static assets. Only then activate new scheduled jobs.
5. Retain the previous release/image and document application rollback. Schema changes must allow the previous release where feasible; destructive column removal follows a later migration after the compatibility window.

Staging on the same physical server can isolate application configuration/data but does not isolate resource exhaustion. If local builds interfere with production, build images in CI or on a separate build server. Initially use one web instance; add replicas only after shared cache/session/rate-limit behavior and background job locking are tested. A single Hetzner host is a failure domain; this design makes no high-availability guarantee.

### Background jobs and provider callbacks

- Put attendance/reminder/cleanup logic in explicit commands included in the deployed image. Schedule them with Coolify, using UTC schedules and explicit church-timezone date calculations. Use database job keys/locks, bounded execution, retries and recorded outcomes to prevent overlap or duplicate processing.
- Run the communications outbox worker as a separate supervised container/resource with graceful shutdown, job leases and restart recovery. Do not use process-local timers or request handlers as durable queues. A database-backed outbox is the initial choice; introduce Redis only if justified by throughput.
- Keep financial and messaging webhooks on stable public HTTPS paths. Verify provider signatures against the raw body, deduplicate events and persist them before acknowledging. Test actual callbacks through the Coolify proxy, including request size/timeouts.
- Define least-privilege credentials per process and monitor last successful execution/queue age. Document how schedules and workers are restored after server loss.

Use Coolify's [scheduled application commands and operational controls](https://coolify.io/docs/applications/operations/overview) for job execution. Correctness still comes from durable job state and idempotent application logic.

### Files, backup and recovery

- Keep documents/audio in a dedicated persistent upload volume mounted into the application at a configured path. Use generated storage keys, bounded streaming uploads, server-side validation and access-controlled download routes; never expose the volume as a public static directory. Support HTTP range requests for audio. Temporary generated documents must be bounded and cleaned up. Multi-host web replicas require shared storage or an object-storage migration before scaling.
- If moving files to external object storage later, migrate metadata, access policies, download signing and actual file bytes together. A web container redeploy must never erase uploads.
- Back up three distinct layers: Coolify control-plane configuration/secrets needed for recovery, the application database, and upload-volume file bytes. Define retention, encryption, alerting, off-server destination and recovery objectives before launch. Restrict backup credentials and protect key recovery materials separately.
- Add Hetzner server backups/snapshots as an infrastructure recovery layer. They do not replace database-consistent or upload-volume backups. Hetzner [server backups exclude attached Volumes](https://docs.hetzner.com/cloud/servers/backups-snapshots/overview/); explicitly back up any such volumes.
- Configure and test [Coolify instance backup/recovery](https://coolify.io/docs/core/backup-and-recovery/instance-backup). Save Coolify's `APP_KEY` securely outside the server separately from its database backup; restored credentials require that key. Use engine-aware PostgreSQL backups and a separate upload-volume backup with a documented consistency procedure linking file metadata to file bytes. Coolify supports [scheduled database backups](https://coolify.io/docs/databases/backups); validate the installed version, backup role privileges, encryption/off-server copies and actual restore. Assess WAL-based point-in-time recovery if the agreed financial data-loss target requires more than periodic logical dumps.
- Perform a restore onto an isolated replacement environment and verify accounts, permissions, ledger, documents, worker processing and schedules. Keep a written server-loss runbook; a successful backup upload is not a restore test.

### Host and operational requirements

Use SSH keys and restricted administrative access. Expose the application through HTTPS and limit SSH/Coolify management access appropriately; do not publish database/worker/internal application ports directly to the internet. Verify Hetzner firewall and Docker/proxy networking together. Configure OS/Coolify maintenance, log rotation, resource limits and disk-space alerts. Monitor public availability from outside the Hetzner host, certificate renewal, backend failures, payment callbacks, worker backlog and job failures. A host restart must recover the proxy, web application and workers without losing acknowledged records.

### PostgreSQL and application-owned identity

- Provision or connect to PostgreSQL with persistent database storage and private networking. If connecting across hosts, validate TLS certificates and restrict network access. Reserve database resources and set connection-pool limits for both web and worker processes; a build must not exhaust database resources.
- Use a migration/owner role separately from runtime roles. Web/worker roles must not be superusers, table owners or have `BYPASSRLS`. Grant only the operations each process needs. Implement server authorization first and PostgreSQL RLS for sensitive branch/owner-scoped data as defense in depth.
- Supply identity/branch context from the verified session inside the same database transaction as its queries, using transaction-local settings. Define policies that deny requests with missing context. Never accept database permission context from request fields or leave it attached to a pooled connection. Give background jobs separately tested scopes. PostgreSQL documents the [owner and role bypass rules for RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html).
- Replace `auth.users`, `auth.uid()`, Supabase API/storage policies and assumed provider roles with application users, sessions and explicit PostgreSQL roles/policies. Create users, profiles and member links transactionally where appropriate; pending phone verification must not grant staff access.
- Use reviewed libraries for password hashing/verification and session handling. Store password hashes using Argon2id with measured settings, never plaintext; use opaque random session tokens, store their hashes server-side, rotate sessions at authentication, enforce expiration/revocation, and use Secure/HttpOnly/SameSite cookies with CSRF/origin protection. Read role/capability changes from the database on privileged requests.
- Store short-lived verification/reset tokens as hashes, consume them once, rate-limit auth/recovery with shared durable state, return non-enumerating errors and revoke affected sessions after credential/privilege changes. Configure actual SMS delivery before phone verification/recovery is enabled. Require stronger authentication for privileged users as part of the auth design.

Authentication implementation follows the [OWASP password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) and [session management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) guidance. Select maintained compatible libraries during Phase 2; do not build cryptographic primitives. Existing live data, if present, must be inventoried and mapped to the new schema; do not execute the old Supabase-specific schema against a plain PostgreSQL instance unchanged.

## Phase 1 — Contain prototype behavior and establish checks

Audit coverage: 14, 25; immediate containment for 1, 2, 5, 8, 9, 12, 23.

Task 1.1 completed on 3 October 2026: removed mock authentication, seeded runtime records, in-memory writes and fabricated analytics. Login/registration, guest intake, kiosk check-in and protected routes display unavailable states until real services are implemented. Existing offline queue storage is preserved. Regression checks (`npm run test:phase1.1`), TypeScript and production build pass. Real authentication/persistence remain scheduled for phases 2–3; tasks 1.2–1.6 are now implemented. See audit/phase-1-results.md for checks, the scoped build-tool advisory disposition and remaining environment verification.

Tasks:

1. Remove mock sign-in, the seeded administrator and seeded application records. Replace each workflow with real authentication/database operations as its foundation is implemented; until then, show an explicit unavailable or empty state. Do not add a demo switch or fallback to mock data when configuration or requests fail.
2. Disable unfinished production actions or clearly show their unavailable state. Remove fake payment confirmations, message-delivery claims, password-change success, file-save/download notices and encryption claims.
3. Remove both Supabase client modules, project-specific fallbacks, Supabase environment keys and `@supabase/supabase-js` when introducing the PostgreSQL data layer. Add a server-only pooled SQL client, validated runtime configuration and separate application/migration credentials. Document environment variables without exposing credentials; do not create a browser database client.
4. Review the saved dependency audit and update Next.js/React and the affected PDF/CSS dependency chains in controlled changes. Remove unused dependencies where appropriate. Review upgrade changes before selecting replacements.
5. Configure non-interactive ESLint, a typecheck command and targeted test tooling. Add CI for clean install, lint, typecheck, tests and production build. Add an advisory review/check appropriate to production and build dependencies.
6. Add a setup README, `.env.example` documentation, migration commands and separate development/staging/production configuration. Verify build and startup with only documented configuration. Add the Dockerfile, `.dockerignore`, standalone runtime, health endpoint and Coolify deployment runbook described above; retire `vercel.json` at that implementation step. Test a clean Linux container build without local secret files.

Deliverables: reproducible setup, clean checks, removal of mock runtime behavior and honest unavailable states.

Exit checks: production cannot use mock sign-in; unused/unimplemented buttons cannot claim success; lint runs without prompts; reviewed dependency findings have fixes or a documented, scoped disposition.

## Phase 2 — Database model, identity and authorization

Implementation is in place on 3 October 2026: seven PostgreSQL migrations, separate runtime/identity roles, phone verification via mNotify API v2, real accounts/sessions/password changes/recovery, staff invitations with TOTP, per-page/server API authorization, RLS, private PDF services and narrowly scoped revocable kiosk credentials. See docs/PHASE-2-SETUP.md, docs/AUTHORIZATION.md and audit/phase-2-results.md. Local isolated SQL/authentication tests pass; actual staging PostgreSQL, SMS delivery, Linux container CI and HTTPS/volume recovery checks remain release gates. Core business reads/writes remain Phase 3, and camera/offline kiosk UX remains Phase 4.

Audit coverage: 1, 2, 3, 7, 13, 16, 18, 25.

Tasks:

1. Replace the Supabase-specific monolithic schema with plain PostgreSQL ordered migrations. Establish UUID keys, foreign keys, timestamps, archive fields and indexes. Maintain typed queries/models against the actual schema and test migrations on a clean PostgreSQL instance.
2. Add application users, password credentials, revocable sessions, verification/reset tokens, profiles, branch memberships/capabilities, and a unique member-to-profile link. Allow verified phone-only users without requiring an invented email. Support member records that have no login account.
3. Add the missing records: service instances/attendance, prayer requests/comments/updates/reactions, guest follow-up stages/tasks, document metadata/versions, households, notification preferences and audit events. Add payment attempts/delivery records as their integration phases start.
4. Implement real registration, sign-in, sign-out, session restoration, password change and recovery against PostgreSQL-backed users/sessions. Normalize validated phone numbers and use exact identifiers. Use transactional, retry-safe account/profile/member provisioning. Implement password hashing, cookie/CSRF protections, phone verification, expiring single-use recovery tokens, shared rate limits and session revocation as specified above.
5. Provision staff through controlled invitations. Remove client-settable role state and arbitrary profile updates. Read permissions from trusted sources on each privileged operation so role changes apply without relying on stale UI state.
6. Create a documented route/action/data permission matrix. Enforce it in server code and RLS, including branch boundaries, self-service fields, pastoral confidentiality and finance permissions. Navigation should use the same capability definitions.
7. Keep all database tables private to server processes. Define least-privilege PostgreSQL grants and RLS on sensitive branch/owner-scoped tables, with SELECT/INSERT/UPDATE/DELETE tests under actual runtime roles. Establish verified transaction-local permission context and test pooled-connection isolation. Avoid recursive policies; prevent self-promotion and protected identity/ownership changes. File permissions are enforced by application upload/download services rather than provider storage policies.
8. Redesign kiosk access around revocable device credentials and narrowly scoped check-in operations. Disable anonymous broad member lookup. Use exact lookup or scoped QR tokens, minimal masked results and request limits. An attended kiosk may allow operator-confirmed identity; stronger self-service proof must be explicit.

Deliverables: reviewed PostgreSQL migrations, real accounts and revocable sessions, capability matrix, protected routes/services, database policies and authorized file-access services.

Exit checks: test anonymous, member, pastor, administrator and another branch against every sensitive operation. Direct URL/API calls cannot bypass permissions. Invalid credentials fail; protected data is absent from unauthorized response bodies; role revocation blocks the next privileged request; password change actually changes login behavior.

Dependency: complete this phase before exposing persistent sensitive data or integrating money/messages.

## Phase 3 — Persist core workflows and protect record integrity

Implemented locally on 3 October 2026. Core screens now use PostgreSQL server APIs with validated writes, privacy policies, archive/restore, transactional audit, retry-safe intake and staged follow-ups. See audit/phase-3-results.md for deployment instructions, verification and remaining scale limits. Private responses deliberately use no-store rather than shared caches. Native PostgreSQL/Coolify staging and cross-device release checks remain required.

Audit coverage: 4, 7, 9, 15, 19, 20, 21, 23; foundation for 24.

Tasks:

1. Replace context-array mutations with validated server operations and database-backed reads for members, profiles, care notes, guests and prayers. Add pending, empty, failure and retry states; acknowledge success only after persistence.
2. Persist registration/profile settings and notification preferences. Restrict which fields a member can edit. Query personal records using profile/member relations, never display-name matching.
3. Enforce confidentiality before data leaves the server. Use an authorized directory projection that excludes private contacts, addresses, birthdays and pastoral status unless the viewer has permission/consent.
4. Persist guest intake and its optional prayer as a linked confidential request. Make intake retry-safe, validate input and preserve the user's form on failure. Track consent and guest follow-up stage independently from attendance/member status.
5. Enforce prayer author/pastor update permissions, moderation, public-versus-private fields and unique per-user reactions. Apply identical visibility rules to the prayer wall, dashboard highlights and counts. Derive actor IDs from the session.
6. Replace immediate member deletion with archive/restore. Specify which linked care/guest records are retained or restricted, preserving financial history. Enforce referential integrity and record access after archival.
7. Generate durable audit events with actor ID, action, entity ID, branch and UTC timestamp. Make events append-only for normal users. Write audit events with important mutations transactionally; audit sensitive reads/exports without copying confidential text into logs.
8. Implement the actual guest stage transitions, assigned follow-up ownership and upcoming birthday calculations. Handle year boundaries and leap-day birthdays explicitly.
9. Add server pagination/search with stable ordering and feature-specific caches as each persistent list is migrated.

Deliverables: durable core administration, consistent privacy, archive recovery and trustworthy audit history.

Exit checks: records survive reloads and appear on another authorized device; duplicate intake retries do not duplicate members; confidential prayers never appear in public highlights; unrelated members cannot edit requests; archived members preserve correct financial links; audit records identify the real actor.

## Phase 4 — Attendance, kiosk synchronization and truthful analytics

Implemented locally on 3 October 2026. Migration 0010 adds completed-service expectations, derived absence streaks and durable check-in receipts. Staff manage services/corrections/households; members receive locally rendered check-in QR codes. The attended kiosk queues in bounded IndexedDB storage and retries only with valid device authorization. Attendance summaries use database records. A private Coolify maintenance resource runs the bounded reconciliation job. See docs/PHASE-4-SETUP.md and audit/phase-4-results.md. Offline availability supports an already loaded tab; no service worker or directory cache is installed. Native PostgreSQL, Coolify scheduling and actual tablet/camera checks remain release gates.

Audit coverage: 10, 11, 18, 23; attendance portion of 24.

Tasks:

1. Model dated service instances with branch, event type, start/end and attendance eligibility. Define when a service is completed and how excused absences, new members, transfers and cell membership affect attendance expectations.
2. Write attendance with a unique `(service_id, member_id)` constraint and operation IDs. Check-in updates must be transactional and return the persisted result. Support authorized corrections with an audit trail.
3. Calculate consecutive eligible absences after service completion. Use a bounded command scheduled through Coolify with durable job keys/locks; rerunning it must not increment counts twice. Recalculate correctly after an attendance correction. Verify recovery after missed executions/redeploys; do not depend on Vercel Cron.
4. Replace fixed chart series, four-week average, capacity/growth badges and monthly figures with database-derived values. Show an honest empty state when insufficient history exists.
5. Store offline kiosk operations in a bounded IndexedDB queue containing operation ID, service ID, recorded time and minimal required data. Preserve original event dates. Distinguish queued locally from saved on the server.
6. Retry only when the server is reachable and the device remains authorized. Remove each item only after acknowledgement; retain failed items, prevent duplicate submission and provide operator-visible resolution for rejected/expired-service records.
7. If offline page availability is required, add a service worker for the kiosk shell only and carefully scoped cached data. Clear sensitive caches on logout/device revocation. Document that a first-ever visit cannot work without prior caching.
8. Wire household check-in to persisted household membership and per-member confirmation rather than inferred shared names/phones.

Exit checks: repeated online/offline check-ins create one record; reconnecting on a different day preserves the original service date; server failure retains the queue; three eligible missed services trigger at-risk status; corrections change analytics accurately; device revocation prevents further uploads.

## Phase 5 — Financial ledger, payments and statements

Audit coverage: 5, 6, 7, 12, 17, 21.

Tasks:

1. Separate a payment attempt from a posted contribution. Add explicit pending/paid/failed/refunded states, verified provider reference, amount/currency and reconciliation metadata.
2. Validate amount, precision, currency, member relation and fund on the server and with database constraints. Enforce unique references/idempotency keys. Preserve anonymous donor support without guessing identity by name.
3. Create checkout on the server using one configured provider. Verify signed webhooks and independently validate transaction/reference/amount/currency before posting the contribution. Handle duplicate and out-of-order callbacks safely. A browser success redirect must not post money. Verify the production HTTPS callback through Coolify, raw-body signature validation, proxy headers and payload/time limits.
4. Retain a separately authorized manual-entry flow for cash/bank giving. Add controlled corrections/reversals with reasons and an audit history instead of destructive financial edits.
5. Filter totals by selected branch, date interval, currency and relevant payment state. Compute monthly and annual windows in the church timezone. Remove hard-coded currency labels and budgets; configure budgets if used.
6. Generate actual PDF receipts/statements from authorized ledger queries. Include selected year, actual currency, church/donor information, references and totals; verify multi-page layout and file validity.
7. Correct CSV exports: escape quotes/newlines, protect spreadsheet formula interpretation, preserve references and currency, and release object URLs. Apply export permissions/auditing and describe exports accurately; exports are not a substitute for a tested database backup.

Exit checks: unpaid/forged checkout cannot create a paid contribution; duplicate webhook creates one contribution; negative/non-finite amounts are rejected; same-name donors remain separate; GHS/USD values never merge silently; year boundaries and refunds produce correct statements; exported files open correctly.

External dependency: payment merchant account, credentials and confirmed supported methods/currencies. Before credentials are available, use provider sandbox fixtures and keep production checkout unavailable.

## Phase 6 — Reliable communications

Audit coverage: 8, 9, 15; communications portion of 23.

Tasks:

1. Configure SMS and WhatsApp channels independently; support only channels with approved/configured provider access. Keep provider secrets server-side.
2. Persist broadcasts and individual deliveries. Use a database outbox and a separately supervised worker deployed through Coolify so dispatch survives web redeploys. Record queued, provider-accepted, delivered and failed separately. Test worker shutdown, leases, retries and restart recovery; keep queue state outside container memory.
3. Resolve recipients within authorized branches, normalize/deduplicate phone numbers and apply saved opt-ins/unsubscribes. Snapshot the recipient set for auditability.
4. Add retry limits, backoff, idempotency and signed delivery callbacks. Provide failed-recipient summaries and a deliberate retry action.
5. Use the authenticated sender and persist editable templates. Reminders may reuse the same delivery pipeline.

Exit checks: members cannot dispatch broadcasts; opted-out members are excluded; retry does not create duplicate sends where the provider supports idempotency; callback failures do not imply delivery; UI counts reflect real outcomes.

External dependency: configured messaging accounts, sender/template approval where required and test recipients. Complete the adapter/queue and sandbox tests before enabling actual sends.

## Phase 7 — Genuine documents and media

Audit coverage: 12, 22, 23.

Tasks:

1. Replace pretend document/audio uploads with file selection, progress, limits, server-side type/content validation and a protected persistent upload volume. Persist actual size/type/storage key and upload state in PostgreSQL; use staged upload/finalization and clean up failed/orphan files. Preserve bytes across web redeploys and test streaming limits through the Coolify proxy. Prevent path traversal and public static exposure; add audio range support and an interchangeable storage adapter.
2. Return the stored record from creation. Select by its persisted ID; remove local duplicate ID generation and stale selected-record objects.
3. Download original files through session-authorized server routes, with short-lived scoped tokens only when needed for deliberate sharing. Render format-appropriate previews or an explicit preview-unavailable state. If generating documents from text is retained, produce genuine DOCX/PPTX/PDF binaries and honor slide-count input; otherwise remove the unused generation controls.
4. Add version metadata, actual save state and authorized edits/deletes. Define retention for previous files; enforce download permissions on every request and expire/revoke shared tokens. Coordinate metadata/files with recoverable states because filesystem operations and SQL transactions are not one atomic transaction.
5. Connect `/sermons` to real sermon records and an HTML audio player. Read duration/progress from audio events and handle loading/playback errors. Validate live-stream URLs and use one live status source for page/header/banner.
6. Put service schedules in one configurable source instead of inconsistent hard-coded copy.

Exit checks: uploaded/downloaded files match expected bytes and open in their native applications; unauthorized downloads fail; document selection points to the created record; audio actually plays/seeks; live status agrees across the app; unavailable media does not show fake progress.

## Phase 8 — Accessibility, performance and release readiness

Audit coverage: 24, 25; final verification of all findings.

Tasks:

1. Replace custom dialogs with accessible primitives supporting focus management, keyboard dismissal, scroll containment and focus restoration. Bind labels, name icon buttons and announce validation/success/error messages appropriately.
2. Review mobile text size, contrast, touch targets, long forms, reduced motion, navigation and empty/error states. Test key workflows with keyboard and a screen reader.
3. Complete paginated directory/ledger/care views and indexed searches. Measure representative data volumes and dashboard bundles; load charts/media only where needed and cache scoped queries safely.
4. Add error boundaries, structured/redacted server logs, monitoring and actionable payment/message/sync failure visibility. Do not log credentials, tokens or confidential note bodies.
5. Validate migrations against an empty database and staging copy. Exercise independent PostgreSQL, upload-volume and Coolify configuration restoration onto an isolated replacement environment. Include Hetzner host/volume recovery, worker/schedule restoration and recovery credentials in runbooks. Plan rollback using retained application images and safe forward database fixes; destructive down-migrations are not the default.
6. Run complete permission, integration, browser and production-container checks through a staging Coolify deployment with synthetic test data before a limited staff pilot. Verify HTTPS, session cookies, actual provider callbacks, container restart/redeploy behavior and external monitoring. Staging is an isolated test environment, not an application demo mode.

Release gates:

- All sensitive read/write paths enforce identity, capability and branch rules; no confidential payloads in unauthorized responses.
- Accounts, records and preferences persist across reload/device changes.
- Payments, deliveries and offline check-ins have verified, idempotent transitions and visible failures.
- Downloads are valid; date/currency reporting reconciles with source records.
- CI runs non-interactively; dependencies have reviewed advisories; no known reachable critical issue remains.
- Core workflows pass keyboard/mobile testing, and backups have a demonstrated restore.
- A clean Linux container build starts successfully behind Coolify; host/container restarts preserve records, uploads and durable jobs. Production has tested callback URLs, health checks, off-server backups and an application rollback path.

## Coverage of every audit finding

| Finding | Primary phase |
|---|---|
| 1 Authentication bypass | 2 |
| 2 Confidential route/data exposure | 2–3 |
| 3 Unsafe/missing RLS | 2 |
| 4 Ephemeral data and sessions | 2–3 |
| 5 False payment confirmation | 5 |
| 6 Currency/date reporting | 5 |
| 7 Profile/member identity mismatch | 2–3, 5 |
| 8 False broadcast delivery | 6 |
| 9 Password/preferences | 2–3, 6 |
| 10 Attendance/absence engine | 4 |
| 11 Offline queue data loss | 4 |
| 12 Invalid downloads/statements | 5, 7 |
| 13 Incomplete/incompatible schema | 2 |
| 14 Dependency vulnerabilities | 1 |
| 15 Incorrect/temporary audit trail | 3, 5–6 |
| 16 Stale role revocation | 2 |
| 17 Contribution validation | 5 |
| 18 Public kiosk privacy/impersonation | 2, 4 |
| 19 Prayer visibility/ownership | 3 |
| 20 Discarded guest prayer | 3 |
| 21 Unsafe/inconsistent deletion | 3, 5 |
| 22 Document identity/selection | 7 |
| 23 Disconnected media/pipeline/milestones | 3–4, 6–7 |
| 24 Accessibility/scalability | 3–4, 8 |
| 25 Configuration/CI/operations | 1–2, 8 |

## Suggested additions after the foundations

| Addition | Delivery point |
|---|---|
| Care assignments, due dates and follow-up history | Basic ownership in phase 3; advanced reminder/escalation workflow after phase 6 |
| Member self-service, privacy and consent | Basic controls in phase 3; broader self-service after staff pilot |
| Branch/cell management and households | Secure relations in phase 2; full administration screens after phase 4 |
| Finance reconciliation, pledges and budgets | Basic reconciliation in phase 5; pledge/budget tools after ledger validation |
| Prayer moderation and private pastoral replies | Basic moderation in phase 3; richer workflow after permissions are verified |
| Events and volunteer rotas | After phase 4 service/branch foundations; separate feature release |
| Operational failure/backup visibility | Phase 8, with integration failure views introduced in phases 4–6 |
| Searchable media/transcripts and broader PWA | Real media in phase 7; transcripts and broader offline support afterward |

## Delivery structure and planning dependencies

Use small reviewable changes: tooling/removal of mock runtime behavior; dependency migration; schema/identity; permissions; core persisted features; attendance; finance; communications; files/media; accessibility/operations. Each feature change includes its relevant tests and migration rather than waiting until the final phase for verification.

Sequence: phase 1 → phase 2 → phase 3 → phase 4. Phases 5, 6 and 7 can follow independently once their phase 2–3 foundations exist. Phase 8 consolidates verification and release preparation; accessibility and operational failure handling should be added during each feature phase as well.

Before infrastructure/provider-specific work, resolve the application domain, Hetzner server architecture/resources, Coolify version, PostgreSQL instance connection/version, persistent upload-volume location and backup destination, merchant account/payment provider, messaging/SMS configuration, confidential-care capabilities, kiosk identity requirements and whether existing deployed data must be migrated. Continue local implementation and sandbox testing while external account setup is pending. Hosting preparation is implemented in Phase 1 task 1.6; completed task 1.1 remains complete.

No reliable calendar estimate is possible until live schema/data, provider accounts and migration scope are known. Track completion through the exit checks above; estimate each reviewable change after those dependencies are confirmed.
