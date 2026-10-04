# Phase 2 setup

Configure the three database roles as described in db/migrations/README.md. In Coolify, use runtime-only settings:

- DATABASE_URL: fgc_runtime data role.
- AUTH_DATABASE_URL: fgc_auth identity role; never the owner.
- DATABASE_SSL_MODE=require and a verified CA across hosts; explicit disable is for a trusted private Docker network only.
- APP_ORIGIN: exact public HTTPS origin, without a path.
- AUTH_ENCRYPTION_KEY: random 32-byte key in base64. Generate in a secure terminal with `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"`. Keep stable across deployments and back up securely off-server. Rotation requires decrypt/re-encrypt maintenance.
- MNOTIFY_API_KEY: API v2 key; MNOTIFY_SENDER_ID: approved sender ID, maximum 11 characters. Ensure credit and OTP routing.
- UPLOAD_DIRECTORY=/app/uploads: private persistent volume writable by UID 1001.

No owner credentials belong in the web resource. Two pools default to five connections each; include both in capacity planning. Missing encryption key denies staff authentication. Missing mNotify configuration disables signup/verification sending/recovery. There is no console OTP or fake-delivery fallback.

1. Apply migrations once to staging through the maintenance resource with MIGRATION_DATABASE_URL.
2. Create a real branch through owner administration, record its UUID and opt in to registration if desired.
3. Register on /login with branch UUID, international phone and a 15–128 character password. Verify using the SMS link and set your password at verification; pending registration never establishes a usable credential. Phone-only accounts require no invented email. Provider acceptance is not delivery: confirm actual receipt in staging.
4. For the first administrator only, run `npm run auth:bootstrap-invite` with owner credentials plus BOOTSTRAP_PHONE, BOOTSTRAP_BRANCH_ID, mNotify configuration and APP_ORIGIN. It invites an existing verified user, prints no credential and refuses once an administrator exists. The user must prove their password and enroll an authenticator before privileges are granted. Do not run automatically on deployment.
5. Sign in with phone, branch ID and password. Apply migration 0015 before deploying password-only staff login. Further staff invitations/revocations use /admin. Password changes revoke all sessions. Staff invitations are accepted using the invitation link and existing password.
6. Run npm run db:check with the data role. Verify wrong credentials, expired/reused links, cross-branch denial, administrator confidentiality denial, password changes and staff revocation on staging. Test direct APIs and navigation as well as initial page loads.

## Kiosk contract

POSTs use same-origin JSON. Device credentials are secret bearer tokens, returned once and revocable. The attended UI holds them in memory, never persistent browser storage.

- POST /api/kiosk/device as branch pastor/admin with `{ "name": "Entrance tablet" }` creates a 30-day device credential. POST /api/kiosk/revoke with `{ "device_id": "uuid" }` revokes it.
- POST /api/kiosk/qr as a verified member with `{ "service_id": "uuid" }` creates a five-minute single-use member/branch/service token. No names or phone directory are returned. QR rendering/camera and offline synchronization follow in Phase 4.
- POST /api/kiosk/checkin with Authorization: Bearer device-token and `{ "token": "member-service-token" }` records unique attendance for an open service. /kiosk provides attended token entry. Invalid/revoked credentials, cross-branch, expired/reused tokens and closed services fail. No anonymous member lookup exists.

## Private files

POST /api/documents requires documents capability, exact Origin, application/pdf, X-Document-Title and a bounded PDF body (10 MiB). It persists private bytes and metadata under RLS. GET /api/documents/uuid returns an authorized attachment; unknown and denied IDs both return 404. The volume is never public static storage. Document UI/versioning and media/range playback follow in Phase 7. This foundation validates PDF signature/size but does not implement malware scanning. A crash between write and commit can leave an orphan; reconcile only against committed metadata and preserve backup consistency.

## Verification boundary

Local tests run real SQL, Argon2 and authentication handlers in isolated PostgreSQL WASM engines with a non-superuser migration owner and actual runtime/identity roles. Cookies and SMS transport are controlled test fixtures, not production alternatives. CI builds Linux containers and migrates disposable PostgreSQL. No live credentials, SMS, production database or deployment are used. Verify mNotify delivery, HTTPS cookies/Origin/TLS, volumes and restoration on staging before release.
