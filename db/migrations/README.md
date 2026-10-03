# PostgreSQL migrations

Phase 2 supplies identity, branch/domain, grants/RLS, security and integrity migrations. Use a fresh PostgreSQL 17+ database with a dedicated owner role. Existing live data needs a reviewed import; these migrations do not import the old prototype schema.

A database administrator must first create three separate LOGIN roles named `fgc_owner`, `fgc_runtime`, `fgc_auth`. All must be NOSUPERUSER, NOBYPASSRLS, NOCREATEROLE and NOCREATEDB. Neither runtime role inherits the owner or the other runtime role. Set strong distinct passwords through secure administration. Give the owner CREATE on the application database and ownership of its public schema; give both runtime roles CONNECT. Migration grants their table/function access. Use isolated databases and credentials for staging and production; keep owner credentials out of the web process.

Supply MIGRATION_DATABASE_URL and explicit TLS configuration, then run npm run db:migrate once from the maintenance image. An advisory lock serializes execution. Files are transactional and recorded with SHA-256 checksums in public.schema_migrations. Repeat execution skips matching files, rejects changed applied files and invalid/duplicate sequence names. Never edit applied files: add ordered migrations instead. Never run migrations from every web startup. Runtime roles cannot read or alter migration bookkeeping.

Do not embed BEGIN/COMMIT or nontransactional operations such as CREATE INDEX CONCURRENTLY. They need a separately reviewed maintenance procedure.

After migration, the owner creates a real branch with registration_enabled=true if public signup is intended; registration is opt-in. Record its UUID. No branch, user, administrator or business record is seeded by these migrations. Owners retain trusted maintenance access through owner-specific policies; runtime policies apply only to the runtime role to avoid recursive identity policies.
