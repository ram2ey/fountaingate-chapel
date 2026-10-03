# Phase 4 implementation — 3 October 2026

Dated services, attendance corrections, expected-participant snapshots, derived absence streaks, household membership, member QR codes, kiosk receipts/IndexedDB synchronization and attendance summaries are implemented. Production data and device credentials are never fabricated.

## Verification

Local lint, TypeScript, production build and regression tests pass. The SQL/auth integration uses isolated PostgreSQL with non-superuser owner, runtime and identity roles. It verifies bounded job catch-up/replay, the three-miss threshold, excused correction, unique operation replay/conflict, audit actor, persisted household membership, exclusion of newly joined accounts, cell-group eligibility, original capture time on delayed upload and device revocation. Queue tests verify capacity, per-device scope, expiry redaction, reconnect-safe timestamps, network/server failure retention, mismatched acknowledgement, rejected-entry retention and revocation redaction using an IndexedDB test engine and isolated transports. QR parsing rejects unknown fields and malformed proofs.

The production dependency audit reports zero vulnerabilities. The previously documented development-only lint advisory chain remains; no blanket development-dependency claim is made.

The built standalone server also passes local HTTP checks: health/no-store, real kiosk capture/scanner controls and referenced static assets, anonymous attendance-page redirect, and no-store staff analytics denial without returned records.

## Deployment and limits

Follow docs/PHASE-4-SETUP.md. Apply migration 0010, deploy the web revision, and separately deploy/schedule the private attendance maintenance resource. No live migration, Coolify job, SMS delivery or deployment was performed here. Docker/WSL is unavailable locally; native PostgreSQL/container CI and real tablet camera/offline/reload behavior remain staging gates.

Participation is snapshotted when the completion job runs. Set end dates and cell membership correctly before completion; ordinary APIs preserve completed snapshots. Offline capture trusts the attended device's clock within the issued proof/service window and a seven-day upload deadline. A cached/open page is required; offline navigation/reload is not provided. Queued proofs are scoped, bounded and redacted on expiry/revocation, but browser storage on a physically compromised tablet is not a secure vault.

Analytics show up to 24 completed services, with a four-service average only when four exist. Staff/member history lists and household/roster projections are bounded; unusually large directories/history need paging extensions. Payments, broadcast deliveries and media data remain in later phases.
