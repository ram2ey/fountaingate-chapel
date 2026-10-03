# Phase 2 implementation and verification — 3 October 2026

Phase 2's local implementation establishes the database, identity and authorization foundation. No seeded administrator, church data, runtime demo or provider fallback exists. Existing Phase 1 containment remains for unfinished business workflows.

## Implementation

- Seven ordered transactional PostgreSQL migrations: identity/users/sessions/tokens/memberships/rate limits; branch/domain records; provisioning; MFA/kiosk security; append-only auth audit; integrity/finance; proof-of-phone account completion.
- Distinct owner, data and identity roles. Runtime policies are explicitly scoped to the data role; fixed-search-path identity functions resolve opaque sessions and current capabilities. Missing/expired/revoked/disabled/unverified context denies data. Transaction-local context and column grants prevent branch/owner reassignment and self-promotion. Administrators do not receive confidential pastoral-care access by default.
- Real phone registration, verification, login/logout, session restoration, password change/recovery and staff invitations. Argon2id hashes, hashed expiring single-use tokens, Secure production cookies, exact Origin protections, bounded request bodies, committed shared rate limits and session revocation. Password is established only at verification; pending account provisioning cannot install an attacker-known usable password or duplicate member records.
- mNotify API v2 integration with runtime key/sender configuration, recorded token message attempts and acceptance checks. Provider timeout is treated as unknown; no automatic resend or delivery-success claim. Test transport is mocked only inside isolated tests.
- Mandatory staff TOTP enrollment/login, encrypted secrets, counter replay prevention and a controlled first-admin invitation command. No direct client role setters.
- Each protected page checks permissions server-side. An early server-layout check handles anonymous redirects using a proxy-overwritten path header; page/API authorization remains independent of it. The obsolete client guard is excluded from production rendering. Navigation uses the same capability definitions. Sensitive APIs independently authenticate/authorize.
- Revocable 30-day device credentials and five-minute single-use member/service/branch tokens. Narrow attended check-in API/UI; no anonymous directory or phone lookup. Camera/QR rendering and offline reconciliation remain Phase 4.
- Authorized private PDF upload/download APIs: bounded bytes, generated private storage keys, RLS metadata, immutable versions, masked 404 denial, attachment/no-sniff/sandbox headers and audit events. Document UI, media playback and scanner workflow remain Phase 7.
- Updated CI for disposable PostgreSQL 17 migrations, repeat/idempotent migration runs, non-owner runtime role checks and Linux container smoke tests. No live server is changed by CI fixtures.

## Local checks

Lint, TypeScript, production build and the full regression suite pass. Final standalone HTTP checks verify health/no-store, the real login form, six protected redirects despite a forged path header, masked file denial, anonymous session handling, CSS and manifest loading. SQL tests use an isolated PostgreSQL WASM engine with a non-superuser migration owner and actual runtime/identity roles, not mocked SQL. Authentication integration runs actual handlers and Argon2, with only cookie/SMS transport and connection adapters supplied by tests. Tests cover phone verification/replay, pre-registration takeover prevention, exact credentials, real password change/reset, session revocation, staff MFA enrollment/replay, rate limits, confidentiality/branch denial, migration/session table protection, immutable identity/ownership, retained-record deletion denial, kiosk replay/revocation and private file access/denial.

Production dependency audit reports zero vulnerabilities. The Phase 1 documented lint-only upstream advisory/compatibility exceptions remain; this report does not declare all development dependencies advisory-free.

## Verification and operational boundaries

No live PostgreSQL connection, migration, mNotify message, staff invitation or deployment was performed. An optional external-database test was rejected by automatic approval review because it could alter roles/schema on a live target; the implemented local tests use isolated in-memory engines instead. Docker/WSL is unavailable locally, so committed Linux container/native PostgreSQL checks have not been observed here. Actual staging SQL/TLS, mNotify receipt, HTTPS cookies/Origin, persistent volume and recovery checks remain necessary before production release.

Migration roles and a real branch must be provisioned through controlled administration. Web configuration needs both data and identity URLs; owner credentials stay in maintenance only. The encryption key and SMS secrets must be supplied securely in Coolify; do not paste them into source or chat. Follow docs/PHASE-2-SETUP.md and docs/AUTHORIZATION.md.

An upload crash before database commit may leave an unreferenced private file; reconcile against committed metadata before cleanup. PDF signature/size validation is not malware scanning. Recovery does not bypass staff MFA. These are explicit operational limits, not hidden success fallbacks.
