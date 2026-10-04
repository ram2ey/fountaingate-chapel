# Phase 6 results

Implemented SMS-only communications using mNotify, PostgreSQL recipient snapshots and a separate restricted Coolify worker. WhatsApp remains disabled. Persisted branch templates replace seeded content; delivery counts derive from actual stored states. Member opt-ins, verified matching phones, sender authorization and branch restrictions apply before queueing and again before dispatch.

Migration 0012 introduces templates, broadcasts, deliveries and narrowly granted worker functions. Queue operation IDs prevent duplicate submissions. Durable leases and pre-send checkpoints distinguish safe restart recovery from uncertain provider outcomes. Confirmed failure retries require a reason, backoff and a three-attempt limit. Authenticated reports are bounded to twelve attempts with exponential backoff; reconciliation cannot resend. Reports must match the provider campaign, recipient, sender and message before marking delivery. No unsigned callback or unsupported provider idempotency feature is assumed.

Validation performed locally:

- Full Node suite: 23 tests passed, including real API handlers and all migration fixtures under restricted PostgreSQL-compatible PGlite roles.
- ESLint and TypeScript checks passed.
- Production Next.js build passed.
- New coverage includes permission denial, template version conflicts, opt-outs, forged fields, queue idempotency, acceptance versus delivery, mismatched reports, leases, durable crash checkpoints, worker shutdown, bounded retries and sender revocation.

CI now builds the messaging worker and checks empty-queue startup against native PostgreSQL using the dedicated role. Linux Docker/CI and live account staging checks were not run locally. No production migration or actual SMS send was performed. Broadcasts default disabled until deployment configuration and approved-recipient staging validation. See `docs/PHASE-6-SETUP.md` for provisioning, rollout and operational behavior. Hubtel activation remains deferred as requested.
