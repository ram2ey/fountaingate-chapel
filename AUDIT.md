# Fountain Gate Chapel code audit

Reviewed 3 October 2026. Scope: the local extracted Next.js project, its routes/components, context/store, TypeScript models, SQL schema, configuration, lockfile and product requirements. No production database, payment provider, messaging account or deployed site was accessed. Findings describe the supplied source; deployed database grants/policies may differ.

## Overall assessment

This is a substantial interface prototype, but it is not ready to handle real church administration or sensitive records. The application uses seeded React state rather than a connected backend. Authentication, confidential information boundaries, persistence and transaction confirmation need to be implemented before real use. Several screens promise operations that currently do not happen.

## Verification

- Installed the existing lockfile using `npm ci --ignore-scripts --no-audit --no-fund`; did not upgrade application dependencies.
- `node node_modules/typescript/bin/tsc --noEmit --incremental false`: passed.
- `npm run lint`: failed to run a lint audit; opens the first-time ESLint configuration prompt. ESLint dependencies/configuration are missing.
- `npm run build`: passed after allowing Next.js to launch workers outside the sandbox; all 17 static pages generated. Initial sandbox attempt failed with `spawn EPERM`; this was an environment restriction. A successful build does not establish authorization or functional correctness.
- Online `npm audit`: 10 affected packages: 2 critical, 7 high, 1 moderate. These are package-level ratings and include transitive/build dependencies; they do not prove every advisory is exploitable in this application. Full machine-readable results: `audit/dependency-audit.json`.
- `node audit/reproduce.cjs`: seven confirmed defects. The harness executes the actual transpiled context with mocked React hooks and storage; it is not a browser end-to-end test. Output: `audit/reproduction-results.txt`.
- No existing automated test suite, CI workflow or database policy tests were found. Browser accessibility, actual provider delivery, storage uploads and production database behavior remain unverified.

## Critical findings

### 1. Anyone can authenticate as the seeded administrator

Evidence: `lib/context/ChurchContext.tsx:150–175`; `lib/store/churchStore.ts:15`; `app/login/page.tsx:28–43`.

`loginWithPhone` never checks `pass`. It matches phone suffixes and always returns success, including for unknown numbers. A phone string containing only letters normalizes to an empty string; every phone ends with that empty string, so the first seeded user (admin) is selected. The isolated harness confirmed both wrong-password and letters-only administrator login.

Fix: replace this function with Supabase Auth password or verified phone OTP authentication; reject invalid phone formats, normalize to one canonical full number and use exact matches. Create staff privileges on the server through controlled invitations. Restore verified sessions on load. Delete the mock sign-in path from production.

Acceptance: wrong passwords, empty/invalid numbers and unknown accounts cannot establish a session; a real member cannot obtain staff privileges.

### 2. Confidential pastoral notes are accessible to a member through a direct route

Evidence: `components/auth/AuthGuard.tsx:13–24`, `app/pastoral-care/page.tsx:9`, `components/care/ConfidentialCareLog.tsx:109–117`, `app/communications/page.tsx:7`.

AuthGuard only checks whether a user exists. Pastoral-care and communications pages have no role check. Navigation hides them from members, but direct navigation renders the pages. ConfidentialCareLog displays every note without considering role or confidentiality. The "Encrypted Pastoral View" badge does not implement encryption. Admin/financial/document pages do include client role checks, but those are not a server security boundary. All sensitive seed arrays are also loaded into the global client provider.

Fix: centralize server-verified permissions, protect every read and mutation, and fetch only authorized fields/rows. Define pastor-only confidential note access separately from general administration, consistent with the product requirements. Remove the encryption claim unless the relevant guarantee exists. Route-level UI guards can supplement database/server checks.

Acceptance: member requests to pastoral data and broadcast actions are denied even when issued directly; unauthorized records never reach their browser.

### 3. SQL policies permit broad sensitive data access

Evidence: `supabase/schema.sql:170–181`.

Policy names say "authenticated" or "admin", but predicates are `true` and there is no `TO authenticated` restriction. For roles granted the corresponding SQL operations, members can be read, members inserted, and care notes/contributions read or changed without role/branch checks. RLS is absent for attendance_logs, sermons and broadcasts. Profiles has RLS enabled but no policies, so normal API access to it would be denied, preventing role lookup once authentication is integrated.

Fix: implement least-privilege grants and explicit policies for all exposed tables, using verified user identity, permissions and branch membership. Prevent users from assigning their own roles. Give members an explicit link to their profile/member record. Add profile read rules and controlled provisioning. Test select/insert/update/delete as anonymous, member, pastor, admin and a different branch. Never place a service-role key in the browser.

This is confirmed in the schema, not confirmed against the deployed database. Supabase explains policy semantics in its [RLS documentation](https://supabase.com/docs/guides/database/postgres/row-level-security).

## High-priority correctness and operational findings

| # | Finding and evidence | Recommended fix |
|---|---|---|
| 4 | **Changes and sessions disappear on refresh.** `ChurchContext.tsx:86–98` initializes all records from seed arrays. Neither Supabase client is imported by application workflows. Guest intake on one device cannot populate staff records on another. Harness confirmed loss on provider remount. | Implement persisted queries and authenticated mutations, loading/error states and confirmed success responses. Use demo fixtures only in an explicitly separate demo mode. |
| 5 | **Giving reports a confirmed transaction without collecting money.** `app/giving/page.tsx:19–40` only calls the in-memory contribution function; provider/phone inputs are not used to initiate a payment. | Create checkout on the server; store pending payments; verify provider signatures/webhooks and amount/currency; mark paid only after verification. Use idempotency keys and unique provider references. |
| 6 | **Financial totals mix currencies and date ranges.** `app/financials/page.tsx:15–18`, `MetricsOverview.tsx:14–16`, `FinancialBreakdownChart.tsx:10–13` add all amounts and label them GHS. Monthly giving includes all dates. `app/giving/page.tsx:83` also labels its success receipt GHS despite USD/GBP selection. | Group totals by currency and date window. If converted, record exchange rate/date/base amount explicitly. Preserve currency on receipts. Filter annual statements by selected year. |
| 7 | **Member identity is inconsistent.** `app/giving/page.tsx:24,46` uses system-user IDs as member IDs and falls back to donor-name matching; seeds use separate `u*` and `m*` identities. Registration adds a member but logs in as generic "Church Member". | Add a unique `profile_id` relationship on member records. Query personal history by that relationship, never donor name. Provision auth/profile/member together through a controlled flow. |
| 8 | **Broadcasts claim delivery without sending messages.** `BroadcastComposer.tsx:29–44`; `ChurchContext.tsx:334`. No provider call or delivery status exists; sender is hard-coded. | Dispatch through a server-side queue, use verified sender identity, opt-in preferences, recipient deduplication, retries and provider delivery callbacks. Distinguish queued, sent, delivered and failed. |
| 9 | **Password change reports success without changing credentials.** `UserProfileSettings.tsx:45–69` validates local fields only; registration also discards the password. | Use the auth provider to verify/re-authenticate and update credentials; report actual provider outcomes. Persist notification preferences and apply them to dispatch. |
| 10 | **Attendance history and automatic absence tracking are missing.** `ChurchContext.tsx:250–277` only updates last-attended/reset counts. It creates no AttendanceLog; nothing increments absences. SQL trigger only reacts to an already changed count. `AttendanceChart.tsx:15–20` and `MetricsOverview.tsx:29` show fixed attendance figures. | Model service instances, attendance and expected participation; deduplicate on member/service; compute absences from completed eligible services, accounting for exemptions. Drive charts and rolling averages from real attendance records. |
| 11 | **Offline synchronization drops evidence.** `ChurchContext.tsx:280–294` ignores saved timestamps, writes today's date, removes the queue without a backend acknowledgement, and can run while offline. No service worker makes fresh page loads work offline. | Preserve event date and unique operation ID; validate queue data; sync only after connectivity/server success; retain failed items; use idempotent inserts and a bounded IndexedDB queue. Only claim offline availability after implementing/testing caching. |
| 12 | **Downloads are not valid document files.** `app/documents/page.tsx:94–104` downloads plain text under `.docx`, `.pptx` or `.pdf` extensions. Upload creates invented size/URL, not a file. `PdfStatementGenerator.tsx:12–17` displays an alert without downloading anything. | Upload actual validated files to protected storage or generate proper binary formats. Produce real statements with year/currency filters. Use signed download URLs, accurate file metadata and file-type-specific previews. |
| 13 | **Schema cannot support the intended application as written.** Types omit required branch IDs, use non-UUID IDs and denormalized names. SQL has no prayer/comment/update, document, guest-retention, household or audit tables. No auth profile provisioning is supplied; profiles requires email despite optional-email/phone registration. | Add versioned migrations and generated database types. Define branch/profile/member relations and storage policies. Make phone-only profile creation viable. Persist each supported workflow before connecting the UI. |
| 14 | **Dependencies contain known vulnerabilities.** Online audit flags Next.js and jsPDF critical, plus the Tailwind toolchain and other transitive packages. `package.json:17` pins Next.js 14.2.15. | Review the saved advisory list and upgrade to supported patched versions in a separate migration, testing framework, React, PDF and CSS compatibility. Remove unused jsPDF if it is not needed. Do not blindly run `npm audit fix --force`; suggested fixes include major upgrades. Re-run build, audit and authorization tests. |

The Next.js [December 2025 security advisory](https://nextjs.org/blog/security-update-2025-12-11) establishes that this App Router version needs security updates. Its historical 14.2.35 patch is not a blanket guarantee against newer advisories in the saved npm report.

## Additional findings

15. **Audit trail is temporary and misattributes actions.** `ChurchContext.tsx:129–140,150–160`, `ConfidentialCareLog.tsx:23–24`, `BroadcastComposer.tsx:37`. Login logs read the previous currentUser because React state updates are asynchronous; other actors are hard-coded. Several mutations lack audit events. Use server-generated append-only events with authenticated actor IDs, record IDs, UTC timestamps and limited/redacted details. Audit privileged reads/exports and role changes.

16. **Role revocation does not update the active session.** `ChurchContext.tsx:205–207` only changes systemUsers, leaving currentRole/currentUser unchanged. Harness confirmed self-demotion leaves an active admin role. Re-evaluate verified permissions after changes and invalidate affected sessions; guard every privileged request.

17. **Contribution validation and database constraints are insufficient.** `ChurchContext.tsx:313`, `RecordGivingModal.tsx:20–36`, `schema.sql:130`. The mutation accepts negative amounts (confirmed), no finite/precision/currency/reference checks exist, and SQL lacks positive-amount constraints. Add server schema validation, decimal-safe money handling, supported currencies, upper limits, non-null relationships where required, and unique transaction references.

18. **Public kiosk reveals contacts and allows impersonated attendance.** `SelfServeCheckIn.tsx:24–31,159–181`. Single-character/whitespace searches can enumerate records; full phones are shown and attendance needs no proof of identity. Use registered kiosk device credentials, limited exact lookup/QR tokens, masked contact results and request limits. Do not deliver the full directory to public browsers.

19. **Confidential prayers need consistent visibility and ownership.** Prayer-wall filters confidentiality, but `MemberDashboard.tsx:10` does not before rendering highlights; a newly submitted confidential active request can appear there. `PrayerCard.tsx:183–189` allows every member to post updates on any request. Seed/retained payloads still include private requester phones; sessionStorage is not a durable anti-abuse control. Filter at the server, add author profile IDs, enforce owner/pastor update permissions, and provide moderation and unique per-user prayer reactions. Handle corrupt/blocked storage safely.

20. **Guest prayer text is silently discarded.** `app/guest-intake/page.tsx:14–32,145`. The form collects it but submits only member fields. Save it as a confidential request linked to the intake, with an explicit consent/access policy, and report submission failures.

21. **Deletes leave inconsistent local records and offer no recovery.** `ChurchContext.tsx:245–248` removes only the member, leaving guest-retention/care/giving references. `app/members/page.tsx:157` deletes immediately. Use archive/undo and deliberate retention rules; preserve financial history and validate referential integrity in database transactions.

22. **Document selection and creation can diverge.** `app/documents/page.tsx:64–79` assigns a document ID, then context overwrites it with another `Date.now()` ID; selectedDoc may not correspond to the stored record. Slide count is unused and generation always creates three slides. Return the actual saved record, store selection by ID and use real generation/configuration. Remove fake save notices.

23. **Media and guest pipeline components are disconnected.** `/sermons` is a coming-soon page. AudioLibraryPlayer, Mp3UploaderModal, FacebookLivePlayer and HouseholdCheckInCard have no consumers. The audio player changes an icon/progress but has no audio element; uploader has no file input. FirstTimeGuestPipeline is a list, not the stated staged retention workflow. Connect real storage/playback and service metadata; implement assignable retention stages/tasks before advertising them. Birthday calendar currently lists every DOB, not upcoming birthdays or reminders.

24. **Accessibility and scale need dedicated work.** Custom modals lack dialog semantics, focus trapping, Escape behavior and focus restoration; many labels are not bound to inputs, and icon buttons lack meaningful accessible names. Whole directories/ledgers are rendered at once and all application state shares one context. Adopt accessible dialog primitives, label controls, test keyboard/screen-reader flows, and add server pagination/search and narrower data caches. Small fixed text and long forms need mobile/browser verification.

25. **Configuration and delivery process are incomplete.** Two Supabase clients have inconsistent fallback settings; one embeds a project-specific public anon key. An anon key is not a service secret, but public keys require correct RLS and hard-coded fallbacks can accidentally target a real project. Consolidate the client, validate env configuration and remove project fallbacks. Add setup README, migration instructions, environment separation, CI, lint config, error reporting and restore drills. Build should not depend on a local secret file being present. Keep `.env.local` out of source control.

## Suggested additions, in priority order

1. **Care assignments and follow-up tasks:** an owner, due date, status, reminders and completed-action history for guests and at-risk members. This converts the current lists into an actionable pastoral workflow.
2. **Member self-service and consent:** edit permitted profile fields, choose directory visibility/contact sharing, track notification opt-ins and provide account recovery.
3. **Branch and cell management:** branch-specific staff permissions, assigned leaders, service calendars and household relationships. The requirements and SQL already anticipate branches; the UI currently does not implement them.
4. **Finance reconciliation:** pending/paid/failed/refunded payments, bank/provider reconciliation, controlled corrections and reversals, receipts and pledge balances. Separate bookkeeping permissions from general admin.
5. **Prayer moderation:** owner edits, private pastoral responses, reporting, urgent assignment and optional notifications without broadcasting sensitive details.
6. **Events and volunteer rotas:** event registration, service teams, assigned shifts and reminders, built on the same branch/service model.
7. **Operational visibility:** actionable delivery/payment/sync failures, server monitoring, backup status and tested restore procedures.
8. **Reliable media library:** genuine audio playback, transcripts/search, live stream configuration and consistent service schedules. Offline/PWA support should follow reliable persisted data and synchronization.

## Recommended implementation sequence

1. Establish explicit demo mode; fix authentication, role enforcement, database/storage policies and dependency vulnerabilities before using real information.
2. Implement the database model, auth provisioning, server validation and durable member/care/prayer CRUD. Add permission/branch tests and persistence tests.
3. Implement service-based attendance and acknowledged offline synchronization; replace synthetic analytics.
4. Integrate verified payments and messaging queues; implement real files/statements and remove misleading success claims.
5. Add care task ownership, consent controls, recovery/undo and branch management; then complete accessibility, pagination and monitoring.

Release gates should include: denied unauthorized direct/API access, no sensitive payloads in member/public responses, persistence across reloads/devices, idempotent payment/check-in replay, correct date/currency statements, successful production build, non-interactive lint, and reviewed dependency advisories.

## Final production build verification

Production build completed with exit code 0, including compilation, type validation, static page generation and build traces. The dashboard reports 213 kB first-load JavaScript, including its chart bundle. The standalone lint command still requires configuration; the build's lint/type phase does not replace a configured lint audit.
