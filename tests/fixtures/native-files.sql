-- Synthetic accounts only in CI's disposable PostgreSQL database. No usable password.
INSERT INTO public.branches(id,name) VALUES('00000000-0000-4000-8000-000000000071','CI file storage');
INSERT INTO identity.users(id,phone,password_hash,phone_verified_at) VALUES('00000000-0000-4000-8000-000000000072','+233241234599','unusable-ci-fixture',now());
INSERT INTO public.profiles(id,full_name) VALUES('00000000-0000-4000-8000-000000000072','CI file owner');
INSERT INTO identity.memberships(user_id,branch_id,role) VALUES('00000000-0000-4000-8000-000000000072','00000000-0000-4000-8000-000000000071','pastor');
INSERT INTO identity.sessions(token_hash,user_id,branch_id,expires_at,mfa_verified_at)
 VALUES(encode(sha256(convert_to(repeat('a',43),'UTF8')),'hex'),'00000000-0000-4000-8000-000000000072','00000000-0000-4000-8000-000000000071',now()+interval '1 hour',now());
