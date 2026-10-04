# Phase 7 results

Implemented migration 0013, recoverable uploads into a private persistent filesystem adapter, a confidential document vault, immutable original versions, title revision checks, authorized downloads/HEAD/range requests, real sermon records and native browser audio controls. Branch-scoped live status and weekly service schedules replace conflicting hard-coded times. New sermons remain unpublished until their owner publishes them; members cannot upload or change media settings. Unused audio-upload placeholder controls were removed.

Supported documents are valid PDFs and UTF-8 text up to 10 MiB; audio is MP3 or PCM WAV up to 50 MiB. File format and extension must agree. Upload progress comes from browser transfer events; success waits for ready metadata. Three recent pending uploads and thirty hourly intents bound each uploader, including invisible archived records. Private UUID keys, exclusive temporary writes, structural validation and no-follow file opens protect storage paths. Client and application transfer timeouts are bounded.

Active document versions remain available indefinitely. Deletion immediately archives the record and denies new reads; scheduled cleanup removes bytes after 30 days while preserving audit/version metadata. Failed/staged/untracked files are reconciled after 24 hours. Cleanup records purge only after removing bytes. If a final database commit acknowledgement is lost, the API checks durable ready state and returns the existing saved record without deleting its bytes. No anonymous sharing or unsupported document generator is enabled.

Validation:

- Full regression suite: 28 tests, including real handlers with PostgreSQL-compatible PGlite role/RLS fixtures.
- Content validation, exact PDF/text byte round trips, retained old versions, stale edit rejection, branch and member denial, unpublished/published audio, 206/416/HEAD responses, upload reservations and interrupted writes.
- Lost-commit recovery, cleanup filesystem failures, untracked-file removal, browser metadata/time events and compatibility with pre-existing document versions.
- ESLint, TypeScript and the production Next.js build passed.

CI now verifies thirteen migrations and adds native PostgreSQL/container HTTP checks for original bytes, non-root persistent-volume writes, restart survival, restricted downloads, ranges and chunked size rejection. Those Linux CI checks were not run on this Windows host. Real device playback, the deployed Coolify proxy, volume restoration and production migrations remain staging/deployment checks; see `docs/PHASE-7-SETUP.md`. No live SMS or payment operation was performed. Hubtel activation remains deferred.
