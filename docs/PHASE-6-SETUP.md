# Phase 6: SMS broadcasts

Communications now stores branch templates, authenticated senders, recipient snapshots and individual delivery outcomes in PostgreSQL. Only pastors/admins with the care capability can queue broadcasts. WhatsApp remains disabled by the church's choice. No demonstration delivery or seeded template is used.

## Database and Coolify deployment

Before applying migration `0012_communications_outbox.sql`, a database administrator must provision the dedicated role:

```sql
CREATE ROLE fgc_messaging LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB NOINHERIT;
GRANT CONNECT ON DATABASE fountaingate TO fgc_messaging;
```

Set its strong, distinct password securely. Do not grant owner, runtime or auth role membership. Run `npm run db:migrate` using the maintenance image and owner credentials, separately from web startup. Migration 0012 grants only the worker functions; the worker cannot read identity tables directly.

Deploy a separate Coolify service from the same repository using Docker target `messaging-worker`. Use a supervised restart policy, no domain or exposed HTTP port, and at least 30 seconds shutdown grace. Its command is `node scripts/messaging-worker.cjs`. It must run the same release as the web application.

Worker runtime variables:

- `MESSAGING_DATABASE_URL`: credentials for `fgc_messaging`, never the owner or web role.
- `DATABASE_SSL_MODE` and, where necessary, `DATABASE_CA_BASE64`: use the existing verified TLS configuration. Disable TLS only on a deliberately private trusted database network.
- `SMS_BROADCAST_ENABLED=true` after approved recipient testing.
- `MNOTIFY_API_KEY` and the approved `MNOTIFY_SENDER_ID` (maximum 11 characters).

Web runtime variables: set the same `MNOTIFY_SENDER_ID` and `SMS_BROADCAST_ENABLED=true` when ready. Its existing mNotify credentials remain necessary for authentication SMS. Do not put migration or messaging database credentials into the web service. Leave broadcast enablement false while provisioning; templates and recipient previews remain available. A disabled worker exits before connecting or contacting mNotify.

## Consent and delivery semantics

Recipients must be active branch members linked to verified accounts, with a matching verified phone and saved SMS opt-in. Unlinked guests and opted-out accounts are excluded. Settings lets each member unsubscribe. Phones are deduplicated and the durable recipient count reflects the actual snapshot. Consent, member status and sender authorization are checked again immediately before dispatch.

The queue accepts 1–1000 recipients per broadcast and limits each sender to ten broadcasts per hour. Messages allow up to 1600 characters; provider segmentation and Unicode can increase charges. Each provider request contains one recipient, making acceptance and report matching unambiguous.

Queued, sending, accepted, delivered, failed, uncertain and suppressed are distinct. Provider acceptance does not prove delivery. Reports must match the saved campaign reference, phone, message and sender. The UI displays actual persisted counts and paginated recipient reports.

The [official mNotify API contract](https://readthedocs.mnotify.com/openapi14.yaml) documents quick SMS and authenticated campaign reports, but supplies no signed callback or idempotency contract. This adapter uses authenticated status polling and exposes no unsigned delivery callback. It does not invent a provider idempotency key. Web queue submission is idempotent by operation ID and payload.

Leases last 90 seconds. A crash before the durable send checkpoint permits safe recovery; a crash or timeout after that checkpoint becomes uncertain and cannot automatically resend. Staff can attach a campaign reference found in mNotify history and reconcile it through an authenticated report. Reconciliation never sends an SMS. Confirmed failures require a deliberate, reasoned retry, with backoff and a maximum of three send attempts. Reports use exponential backoff, a one-hour delay cap and twelve attempts per reporting cycle; staff may explicitly request another reporting cycle. These decisions are audited. Graceful shutdown stops new claims and aborts in-flight HTTP safely.

## Release checks

Run `npm test`, `npm run lint`, `npm run typecheck` and `npm run build`. CI builds the worker and starts it once against an empty disposable PostgreSQL queue using its restricted role; that check makes no SMS request. Local tests use synthetic records and mocked provider responses, including accepted versus delivered, report mismatches, opt-outs, sender revocation, crash recovery and retry limits.

Before production enablement, deploy to staging, approve a real test recipient, verify their opt-in, queue one message and compare acceptance/report status with the provider portal. Exercise worker restart and unsubscribe handling. This requires account access and incurs provider charges; it has not been performed by the implementation tests. Monitor uncertain/exhausted deliveries and worker failures. Back up the queue with PostgreSQL; keep credentials out of logs. Reminder producers can enqueue through the same authenticated pipeline; automatic reminder scheduling is not introduced in this phase.
