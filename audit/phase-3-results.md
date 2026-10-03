# Phase 3 implementation and verification — 3 October 2026

Core member administration, profile/preferences, pastoral care, guest follow-up and prayer screens now use persisted PostgreSQL records through authorized server APIs. No demo data or simulated successful writes are enabled.

## Implementation

- Migrations 0008–0009 add opted-in public intake, confidential linked guest prayers, durable intake deduplication and unique staged follow-up tasks. Intake creates a guest record, not a login account.
- Validated writes derive actor and branch from verified sessions. Directory access is staff-only; ordinary members cannot receive contacts, addresses or birthdays through these APIs. Unknown profile fields are rejected.
- Private prayers are readable by their author and pastors. Branch-visible prayers use the same database policies on the wall and dashboard highlights. Author/pastor status changes and updates, comments and unique user reactions persist transactionally.
- Member archive/restore preserves identifiers and financial links. Archived members' care and guest prayers are hidden; guest follow-ups are archived/restored with the member. No hard deletion occurs. Archiving a directory member does not revoke their login account; disable membership through identity administration when access must end.
- Mutation and sensitive directory/care read events record actor, branch, entity and UTC timestamp without copying note/prayer bodies. Anonymous intake events explicitly have no authenticated actor and are retained in the protected identity audit table.
- Guest transitions advance one stage at a time, require contact consent and restrict assignment to active branch staff. Tasks have unique member/stage keys. Birthdays use the UTC calendar, observing 29 February on 28 February in non-leap years.
- Core lists use bounded pages, escaped parameterized search and stable timestamp/UUID cursors. Responses use no-store to avoid sharing private data or stale permissions. Birthday results are bounded, although calculation currently reads the branch's dates before sorting; SQL-side calculation is a future scale optimization. Prayer discussions return the oldest 100 entries; larger-thread pagination is a future extension.

## Coolify deployment

Use the existing Hetzner/Coolify PostgreSQL deployment and separate runtime, identity and migration credentials. Run `npm run db:migrate` in a maintenance job with the owner credential before deploying this revision. There are nine migrations; rerunning the migration runner is safe. Keep owner credentials out of the web process.

Public intake is disabled by default. After reviewing branch consent and operational ownership, a database administrator can opt in the intended branch:

```sql
UPDATE public.branches SET guest_intake_enabled = true WHERE id = '<actual-branch-uuid>' AND archived_at IS NULL;
```

The public form requires that branch UUID. This identifier grants no directory access. Supply the existing runtime database URLs, APP_ORIGIN and mNotify configuration in Coolify. Back up PostgreSQL and private storage using the existing runbook.

## Verification

Lint, TypeScript and the full local regression suite pass. Isolated PostgreSQL tests exercise real roles, RLS and transactions; integration tests verify persisted profile changes, care confidentiality, archive/restore, unique prayer reactions, comments/updates, retry-safe intake, stage validation, staff assignment and birthday boundaries. Tests use isolated fixtures, not a production fallback mode.

No live database migration, SMS message or deployment has been performed. Verify native PostgreSQL migrations, HTTPS sessions, two-device reloads, opted-in public intake and database backup recovery on staging before release. Docker/WSL is unavailable locally. CI and live staging results must be checked independently.
