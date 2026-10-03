# Phase 4: attendance and kiosk operations

Apply migration `0010_attendance_workflows.sql` with the maintenance owner before deploying this application. Keep migration credentials out of the web container. PostgreSQL remains the system of record; no demo or fabricated analytics is enabled.

## Services and eligibility

Staff use `/attendance` to create dated services, record/correct attendance, manage household membership and set participation intervals. Inputs use the operator's local timezone; the server requires ISO timestamps with an explicit timezone and stores UTC instants. Service dates come from the service instance, never from the reconnect date.

Completion occurs after the service's configured end through the scheduled maintenance command. Eligible, active/at-risk members whose participation began before the service and has not ended become expected participants. Guests are excluded until promoted to active membership. A cell meeting requires an exact saved cell group. Departed/transferred members with a saved participation end remain eligible for historical services within that interval; do not omit their end date. Archival excludes members from new snapshots. Historical snapshots remain immutable through ordinary APIs, so changing future eligibility or cell membership does not rewrite completed history.

Three consecutive missed eligible services flag an active member as at risk. Present and excused records break the streak. Services for which the member was not expected do not add misses. Counts are rebuilt from completed history, not incremented each time a job runs. Staff can correct present/excused/absent states with a reason and actual service time; an operation ID makes a retry safe. Corrections recalculate streaks and refresh the attendance view. Financial, capacity, growth and budget numbers are not inferred from attendance.

## Coolify schedule on Hetzner

Build a separate resource from Dockerfile target `attendance-scheduler`. This inherits the maintenance image, runs as `node`, stays alive without a network listener and exposes no public port. Supply `MIGRATION_DATABASE_URL` and database TLS settings to this private resource only. Its owner credential is privileged; restrict terminal access and secrets as for migrations.

In the resource's **Configuration → Scheduled Tasks**, add:

| Setting | Value |
|---|---|
| Name | Reconcile completed attendance |
| Command | `node scripts/reconcile-attendance.cjs` |
| Frequency | `*/5 * * * *` |
| Timeout | 120 seconds |
| Container | Running attendance maintenance resource |

Coolify enters the selected running container; do not include `docker exec` in the command. See [Coolify's task creation guide](https://coolify.io/docs/core/automation/scheduled-tasks/create-a-task). The frequency follows the server timezone; database completion compares timestamptz instants, so this frequent schedule needs no church-calendar assumption.

Run **Execute Now** on staging and inspect execution output and affected services. The command processes at most 100 ended services per run, under a 60-second database statement timeout. Durable completion timestamps/unique expectation keys and advisory locks make reruns and concurrent jobs safe. A crash rolls back the transaction; the next execution catches up from the oldest unfinished service. A backlog greater than 100 drains over successive executions. Monitor failures and backlog age; benchmark large branches before enabling the job. Do not run the command inside the ordinary web image.

## Kiosk and offline operation

Staff issue/revoke device credentials in `/attendance`. Save the ID securely for revocation. Credentials expire in 30 days and stay in kiosk memory only. Members request a five-minute QR code from their dashboard for a service within its check-in window (one hour before start through end). Codes are encoded locally. The attended kiosk scans the QR or accepts the service ID and token manually. Camera support depends on the browser; manual entry remains available. See [QR encoder documentation](https://github.com/soldair/node-qrcode) and [browser detector documentation](https://developer.mozilla.org/en-US/docs/Web/API/BarcodeDetector).

An already loaded kiosk tab can capture while offline. No service worker or private directory cache is installed: a first visit or offline reload needs a connection, and a member needs a previously issued valid proof. Capture stores an operation ID, service ID, original timestamp and short-lived proof in IndexedDB, scoped by a hash of the device credential. The queue is bounded to 200 records across devices; full/unavailable storage rejects capture explicitly. Protect the physical tablet and browser storage.

Synchronization checks server reachability and device authorization. Only a receipt naming that operation removes it. Network errors, 429/5xx and invalid receipts retain the entry. Rejected/expired-service entries stop automatic retry and remain visible for staff review. Explicit discard is available after staff resolution; it never records attendance. Revoked/expired devices cannot upload even an acknowledged retry; queued proofs are redacted when authorization is checked. Proofs older than seven days are redacted on queue access, leaving minimal resolution metadata.

The server validates proof issue/expiry against recorded capture time and service window, with at most seven days after service end to upload. This is an **attended device trust policy**: the server cannot independently prove an offline clock. Keep clocks synchronized; suspected clock errors or backdating require staff correction. Late uploads update completed-service statistics and absence streaks without moving the service date. Kiosk retries preserve existing staff corrections rather than silently overwriting them.

Household attendance uses explicit saved household/member IDs in the staff workspace, with confirmation for each person. A member QR grants no household directory lookup or blanket family check-in.

## Release checks

Before production: run native PostgreSQL migrations/job, verify same-operation replay and next-day upload, revoke a device with queued work, exercise browser storage capacity and reload recovery, test camera/manual capture on actual tablets, and verify three misses plus present/excused correction on a second authorized device. Test another branch and an ordinary member against staff APIs. Verify database backup recovery. Local tests use isolated PostgreSQL and an IndexedDB test engine; they do not replace hardware/staging checks.
