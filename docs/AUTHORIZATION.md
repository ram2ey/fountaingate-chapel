# Phase 2 permission matrix

The browser uses `lib/auth/permissions.ts` for navigation. Every protected page calls `requirePageAccess`; layouts and client guards are presentation only. Every sensitive API checks a verified session, capability and current branch. SQL runs through `authorizedTransaction`, with a transaction-local opaque session token. PostgreSQL resolves its hash against live sessions/memberships and denies missing, expired, revoked, disabled or unverified identities. A pooled connection does not retain transaction-local context.

| Resource/action | Anonymous | Member | Pastor | Administrator |
|---|---|---|---|---|
| Register, verify phone, sign in, recovery | Validated and rate limited | Same | Same; TOTP for sign-in | Same; TOTP for sign-in |
| Own profile/password/preferences | Denied | Own account | Own account | Own account |
| Member contacts, households, follow-ups | Denied | Own member row only; no directory page | Current branch | Current branch |
| Services and attendance | Denied | Current-branch services, own attendance | Current branch | Current branch |
| Care notes | Denied | Denied | Current branch including confidential | Current branch, nonconfidential only |
| Prayers/comments/reactions | Denied | Own/private or branch-visible | Current branch, moderation | Current branch, moderation |
| Confidential documents/files | Denied | Denied | Current branch | Current branch, own confidential or nonconfidential |
| Giving ledger | Denied | Own member-linked entries | Own member-linked entries | Current branch finance |
| Staff invitation/demotion | Denied | Denied | Denied | Current branch; elevation requires accepted invitation/TOTP |
| Kiosk credential creation/revocation | Denied | Denied | Current branch | Current branch |
| Member service token | Denied | Own account/current branch | Own account/current branch | Own account/current branch |
| Kiosk check-in | Revocable device credential plus single-use member service token | Same | Same | Same |
| Audit records | Denied | Append own events only through server operations | Append own events only | Read current branch; append own events |

Another branch is denied, including foreign-key links. Staff cannot update identity, ownership, branch IDs or member-profile links through data-role grants. Runtime DELETE is limited to the actor's prayer reactions. Retained records use archive fields; financial and audit history cannot be deleted through the runtime role. Confidentiality is enforced before file metadata or bytes are returned. No broad anonymous phone/member lookup exists.

`fgc_runtime` has no direct identity-table access. `fgc_auth` can manage identity records but cannot read care, prayer, giving or document content; its security-definer provisioning/check-in functions have fixed search paths, explicit validation and no public execution. `fgc_owner` alone owns migrations/tables; do not expose it to the web process. Identity credentials are sensitive: compromising the identity process can compromise accounts. Use the same private server controls as password/session storage.

Most business workflows remain unavailable until Phase 3 and later services are added. SQL policies establish their boundaries now. UI visibility does not authorize an operation.

Password hashing uses Argon2id (64 MiB, three passes, one lane); benchmark on the deployment server before adjusting costs. Sessions last eight hours, use random 256-bit opaque tokens, store hashes only, and set HttpOnly/Secure-in-production/SameSite=Strict cookies. Mutating APIs require the exact configured Origin and JSON, except PDF uploads which require Origin and a specific PDF content type. Recovery links expire in 15 minutes and are single-use; staff invites expire in 24 hours; kiosk member tokens expire in five minutes and bind the service/branch. Staff authenticator secrets use AES-256-GCM under a separately backed-up 32-byte key; accepted counters cannot be reused.

References: [OWASP password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), [OWASP sessions](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html), [OTPAuth](https://hectorm.github.io/otpauth/), [mNotify API v2](https://readthedocs.mnotify.com/).
