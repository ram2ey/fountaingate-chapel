# Phase 7: documents and media

The document vault supports original PDF and UTF-8 text files up to 10 MiB. The sermon archive supports MP3 and PCM WAV up to 50 MiB. Unsupported office formats are rejected explicitly; no DOCX/PPTX generator or pretend export is retained. PDFs must parse and contain pages, text must decode as UTF-8, and audio containers/frames must pass structural validation. Browser playback additionally depends on the browser's decoder.

Each uploader is limited to three recent pending uploads and thirty upload intents per hour, including failed and archived records. Stale staging rows stop consuming the active limit after ten minutes and are reconciled after 24 hours. Monitor free disk space and cleanup backlog alongside these bounds.

## Deploy on Hetzner with Coolify

1. Back up PostgreSQL and upload bytes together. Apply migration `0013_documents_media.sql` through the maintenance image before deploying the matching web image. Existing document version metadata is imported; storage keys keep pointing to the same original bytes.
2. Mount persistent storage at `/app/uploads` and set `UPLOAD_DIRECTORY=/app/uploads`. The web process uses UID/GID `1001:1001`; the mount must allow that identity to create and remove files. Keep it outside `public/`, with no proxy alias or static server route. All file URLs go through session authorization. Never use container-local disposable storage for production uploads.
3. Deploy the private `files-scheduler` Docker target with the same upload mount and `UPLOAD_DIRECTORY`, plus `MIGRATION_DATABASE_URL` for `fgc_owner` and the existing database TLS settings. This target also runs as `1001:1001`. Keep owner credentials out of the web and SMS worker.
4. Schedule `node scripts/cleanup-files.cjs` daily in that resource. Each run handles up to 500 eligible records; run more often if cleanup backlog exceeds daily capacity. It uses an advisory lock to prevent overlapping runs and reports failures without exposing paths or credentials.
5. Confirm HTTPS routing and the correct `APP_ORIGIN`. Ensure any proxy/CDN body limit permits 50 MiB audio and request timeouts accommodate uploads. The application enforces byte limits even without Content-Length, a 30-second inactivity timeout and a five-minute transfer budget. No automatic proxy retry should repeat an upload POST.

[Coolify storage documentation](https://coolify.io/docs/applications/configuration/persistent-storage) explains mount configuration; storage is local to the deployment server. Multiple web replicas must use the same shared filesystem, otherwise keep one web instance. The storage boundary in `file-storage.cjs` provides write/open/remove operations that can be replaced by another backend; only the local private-volume adapter is configured in this release.

If using [Traefik buffering middleware](https://doc.traefik.io/traefik/middlewares/http/buffering/), its body-size limit can reject requests before they reach the app and it buffers the body. Review the actual router/middleware configuration rather than adding an untested global label. Test the deployed proxy route below.

## Recovery, versions and deletion

An upload commits a staged database row, streams to an exclusive `.part` file, validates contents, renames the completed file, then commits ready metadata and an audit event. Only ready files appear in the vault/archive. The UI uses the returned persisted record ID and version, shows actual transferred bytes, and waits for validation/save acknowledgement before reporting success.

If a connection is interrupted or validation fails, the row becomes failed and its bytes are removed when possible. If database commit acknowledgement is lost, a ready record's bytes are preserved; refresh the list before retrying. Process death or unavailable credentials can leave staged/orphaned files for the maintenance job. Unknown keys and partial files older than 24 hours are reconciled. The job deletes bytes before recording a purge, allowing retry after a database failure.

Active document versions are retained indefinitely and downloadable by their persisted version ID. Replacing content and renaming titles use revision checks; stale edits fail rather than overwriting newer work. Deleting a document or sermon archives its metadata, immediately denying new download requests. Bytes are retained for 30 days, then removed by cleanup. Audit and version metadata remain for traceability; backups follow their own retention policy. No public sharing tokens or anonymous sharing endpoints are enabled.

Documents remain confidential: their owner and authorized confidential-care staff may read them, while only the owner may edit/delete them. Other branches cannot read them. Sermons start unpublished; their owner can publish/edit/delete them. Verified members of that branch may read published audio. Every audio/download/HEAD/range request checks the current session and row permissions. Native audio controls handle play/pause/seeking, with duration and position taken from audio events and explicit failure messages.

## Live services and schedules

Authorized staff configure live status, a direct HTTPS Facebook/YouTube URL and up to twelve weekly service times in the media hub. Live status is a staff-controlled declaration, not a fabricated provider availability check. The header and live-service card read the same saved branch settings; they refresh every 30 seconds and immediately after saving. Missing configuration displays no live service or schedule. Times are explicitly Africa/Accra. Members cannot change these settings, and revisions protect concurrent edits.

## Staging release checks

- Upload a valid PDF, text, MP3 and PCM WAV through the actual HTTPS Coolify domain. Download originals and compare SHA-256/bytes. Verify native document opening, text preview and browser audio play/pause/seeking, metadata duration and failure handling.
- Upload a document replacement and download both versions. Exercise stale edits and selection after creation. Test unauthorized, confidential and other-branch access; published versus unpublished audio; and access after deleting or revoking the session.
- Test 10 MiB document and 50 MiB audio boundaries, oversize chunked uploads, slow/interrupted uploads and invalid content. Verify application/proxy errors rather than an apparent successful save.
- Redeploy the web image and confirm original files remain downloadable. Check disk permissions using the non-root identities. Verify audio range requests return 206, invalid ranges return 416 and HEAD returns metadata without bytes.
- Exercise cleanup on an isolated database/volume, including staged/orphan files, archived files beyond 30 days and a filesystem failure. Restore database and bytes together and compare representative downloads.

Local tests cover real API handlers, restricted SQL roles, exact byte round trips, versions, authorization, publish state, range/HEAD behavior, content validation, interrupted writes and cleanup recovery. CI adds native PostgreSQL/container volume persistence and HTTP size/range checks. Linux CI, the deployed Coolify proxy, real device playback and production backup restoration require staging execution; local Windows checks do not prove those outcomes.
