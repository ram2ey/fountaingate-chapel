# Phase 5 results — 2026-10-04

Implemented PostgreSQL payment attempts and an immutable signed ledger, cash/bank entries, idempotent partial reversals, documented Hubtel portal refund confirmations, session-bound branch/donor access, monthly/annual reports, personal giving, and authenticated real PDF/CSV exports. Legacy contributions are imported once; the legacy table is retained and its runtime insert permission revoked. New writes require live sessions and database-enforced capabilities. No demo mode exists.

Hubtel selection: GHS, mobile money/cards, Africa/Accra. Hosted initialization is server-only and gated off by default. Provider credentials stay server-side; browser redirects and callback body claims never post credits. Independent authenticated status verification must match reference, gross amount, GHS and transaction ID. PostgreSQL serializes transitions, enforces one credit and caps adjustments; duplicate/stale responses preserve credited/refunded states. Refund recording is explicitly a staff confirmation with stored portal evidence, not an automatic provider refund API.

## Verification

- Full regression suite: **19 tests passed**, including real handler/SQL transactions under `fgc_runtime`, `fgc_auth` and an owner role. Integration exercises exact minor-unit amounts, GHS/USD separation, year boundaries, original/reversal receipts, same-name identity separation, idempotency conflicts, excess adjustments, audit events, immutable table privileges, denied exports, forged callbacks, amount mismatch, duplicate notifications and stale status after refunds.
- Upgrade test applies migrations 0001–0010, inserts a retained contribution, archives its donor, applies 0011 and verifies preserved ID/member/amount/fund/date and the donor's continuing self-access. Runtime inserts cannot claim an already-paid attempt.
- PDF fixture: actual nine-page A4 PDF, parsed with pdf-lib and Poppler, rendered and all nine pages visually inspected. Static Noto Sans fixes a variable-font subset issue detected through visual inspection. Unicode names, wrapping, margins, references and page numbers render correctly; unsupported glyphs fail explicitly instead of corrupting names.
- CSV cells escape quotes/newlines, neutralize untrusted spreadsheet formulas, preserve UTF-8 and keep validated decimal adjustments numeric. Downloads use server URLs and create no browser object URLs.
- Lint, TypeScript and production build pass. Next.js standalone tracing includes the licensed static font for the finance endpoint.
- Production dependency audit: **zero vulnerabilities**. The existing five high development-only lint-chain advisories remain the previously documented compatibility exception; no production dependency is affected.

## Deferred activation and environment boundaries

The user deferred Hubtel merchant-portal API details and activation. `PAYMENTS_ENABLED=false` and `HUBTEL_CONTRACT_CONFIRMED=false` remain the defaults. The hosted initialize contract still requires merchant documentation confirmation; the status contract follows the official public Hubtel Flutter SDK but must be checked for the same merchant account. No public callback-signature specification was verified: a random URL capability plus independent authenticated provider lookup is implemented, and merchant-specified raw-body signatures must be added if required. Merchant response fixtures exercise the adapter, not a live provider sandbox.

No live payment, production migration, Hetzner/Coolify deployment, native PostgreSQL/Docker run or authenticated browser UI run occurred. GitHub CI contains Linux container/native PostgreSQL migration checks; it must be observed after pushing, not assumed successful. Required merchant staging, HTTPS callback, any outbound IP allowlisting, proxy log suppression and backup/restore checks are documented in [Phase 5 setup](../docs/PHASE-5-SETUP.md).

Online financial dates use first successful verification time; the public verified status model exposes no settlement timestamp. Reports require reconciliation against settlement records before closing delayed year-boundary payments. Ledger exports are limited to 10,000 rows with an explicit narrowing error; payment-attempt display is bounded to the latest 50 matching attempts. Exports are not database/private-file backups.
