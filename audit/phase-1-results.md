# Phase 1 implementation and verification — 3 October 2026

Phase 1 tasks 1.1–1.6 are implemented. Real authentication, domain migrations and persisted workflows remain Phase 2–3 work. No demo mode exists.

## Changes

- Removed mock sign-in, seeded records and in-memory mutation implementations; protected routes and unfinished public workflows show unavailable states.
- Disabled payment, broadcast, password-change, document/PDF, audio playback and upload simulations. Removed the unsupported encryption label.
- Removed Supabase clients, schema, dependencies and environment entries; retired Vercel configuration and updated the original requirements.
- Added a lazy server-only PostgreSQL pool, validated TLS/configuration, parameterized query entry point, transaction cleanup, distinct migration credentials, checksummed ordered migrations and a runtime-role check command. No domain schema is created in this phase.
- Upgraded Next.js/React and CSS tooling, removed unused PDF/chart packages, patched nanoid, added strict lint/typecheck/tests and Linux CI.
- Added non-root standalone Docker runtime, maintenance target, health endpoint, secret exclusions, environment example, README and Coolify deployment/recovery runbook.

## Local verification

- Lint and TypeScript pass.
- Seven Node test cases pass, including eight Phase 1.1 regression groups and transaction commit/rollback/connection-discard checks.
- Production build passes; standalone HTTP checks confirm health status/no-store and unavailable login/giving/kiosk pages.
- Dependency tree resolves. Production-only dependency audit: zero vulnerabilities.
- Migration command correctly reports that Phase 2 domain migrations are not yet present. This is not a database connectivity or migration integration test.

## Scoped dependency disposition

Full dependency audit retains five high findings in one development-only chain: eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces. The braces stack-exhaustion advisory covers the latest published 3.0.3; no patched release was available. The dependency is used for trusted repository lint glob patterns, not application request processing, and is excluded from the standalone runtime. No forced downgrade to the old Next.js lint configuration was applied. CI blocks production vulnerabilities and saves the complete audit for review. Revisit this chain when upstream releases a compatible patch.

ESLint 10 currently crashes the React plugin bundled by Next's configuration. ESLint 9.39.5 is retained for compatibility, although npm marks the major unsupported. Revisit with the same upstream compatibility update. This is an explicit temporary build-tool exception, not a claim that all dependencies are vulnerability-free.

## Environment verification still required

This workstation has no Docker engine or installed WSL, so Linux container build/startup checks are committed to GitHub Actions but have not run here. The downloaded workspace has no Git repository; publishing it to GitHub is needed to trigger CI. Clean Linux installation is likewise a CI check, not a locally observed result.

No PostgreSQL credentials were supplied. Live TLS/connectivity, runtime-role privileges and actual migration integration must be checked against staging when the database exists. No live deployment occurred. Before production release, run the CI container checks and the runbook's database, secret, persistent-volume and backup/restore checks. Successful local checks do not establish production readiness.
