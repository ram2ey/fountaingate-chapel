# Phase 8 local results — 4 October 2026

Implemented native accessible mobile navigation with focus containment, Escape dismissal, scroll containment and focus restoration; skip links, named navigation, current-page links, larger touch targets, reduced-motion CSS, and generic error boundaries. Removed four unused legacy dialog components that called unavailable actions.

Added independently paginated confidential guest prayers, birthdays and payment attempts. Ledger paging preserves previously loaded attempts. Dashboard totals use a summary query and a separate lazy component; audio files load on demand instead of preloading each list item. Migration 0014 adds paging/search indexes and optimizes selected RLS read policies with statement-scoped session resolution. Branch, identity and confidentiality predicates remain enforced.

Added a permission-scoped operational status page, fixed-schema redacted error logs, private aggregate operational checks, a migration/file-integrity restore verifier, and the Hetzner/Coolify release and recovery runbook. No staging deployment, provider send, payment or infrastructure change was performed.

Local verification:

- All 32 Node regression tests pass. The real-handler SQL integration test additionally checks operational permissions, pastor-only confidential care/guest-prayer paging, independent payment-attempt paging, summary reports and leap-day birthdays. Empty-schema and existing-record upgrade tests apply migration 0014.
- Lint, TypeScript and the production build pass.
- Six desktop/mobile Chromium browser tests pass, covering all account form modes with WCAG A/AA axe checks, keyboard validation, mobile overflow and anonymous denial. Two authenticated-dialog cases are intentionally skipped locally: one desktop case is not applicable; the mobile case requires the disposable native PostgreSQL CI fixture. CI now runs that mobile check with actual SQL-backed sessions. Its result is pending, not assumed successful.
- Production dependency audit reports zero advisories. The full audit records five existing high advisories in the development lint dependency chain; no forced downgrade was applied. Both audit JSON files are retained for review.
- An isolated restricted-role PostgreSQL WASM benchmark uses 10,000 members, 5,000 care notes and 10,000 ledger rows. Directory authorization initplans reduced an observed search from roughly 1,018 ms to 19 ms in this local engine. Final measurements and actual index use are in `phase-8-performance.json`; these are not Hetzner/native PostgreSQL latency claims. Directory substring search used a sequential scan under RLS; adding a trigram index does not guarantee its use.
- The dashboard client-reference inventory plus root JavaScript chunks is approximately 151 KiB gzip, below the conservative 512 KiB budget. Exact figures are recorded in `phase-8-bundle.json`; the inventory includes lazy references rather than claiming exact initial network bytes.

Outstanding release evidence: native Linux container CI, a Coolify staging deployment, HTTPS/cookie behavior, native PostgreSQL staging-copy migration/performance, manual keyboard/screen-reader review of authenticated workflows, independently restored PostgreSQL/uploads/Coolify on a replacement Hetzner host, worker/schedule recovery, approved actual mNotify delivery/report checks and external monitoring alerts. Hubtel merchant details and activation remain deferred. These are explicit gates in `docs/PHASE-8-RELEASE.md`, not completed deployments or backups.
