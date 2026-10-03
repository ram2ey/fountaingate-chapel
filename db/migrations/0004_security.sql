ALTER TABLE identity.users ADD COLUMN totp_secret_encrypted text, ADD COLUMN totp_last_counter bigint NOT NULL DEFAULT -1;
ALTER TABLE identity.tokens ADD COLUMN service_id uuid REFERENCES public.services(id);
CREATE TABLE identity.message_attempts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), token_hash text NOT NULL REFERENCES identity.tokens(token_hash),
 status text NOT NULL CHECK(status IN ('pending','accepted','failed','unknown')), provider_id text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT,UPDATE ON identity.message_attempts TO fgc_auth;
CREATE FUNCTION identity.kiosk_checkin(device_token text, lookup_token text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,identity,public AS $$
DECLARE device identity.kiosk_devices; lookup identity.tokens; member uuid; BEGIN
 SELECT * INTO device FROM identity.kiosk_devices WHERE token_hash=encode(sha256(convert_to(device_token,'UTF8')),'hex')
 AND revoked_at IS NULL AND expires_at>now();
 IF device.id IS NULL THEN RETURN false; END IF;
 SELECT * INTO lookup FROM identity.tokens WHERE token_hash=encode(sha256(convert_to(lookup_token,'UTF8')),'hex')
 AND purpose='kiosk_lookup' AND branch_id=device.branch_id AND consumed_at IS NULL AND expires_at>now() FOR UPDATE;
 IF lookup.user_id IS NULL OR lookup.service_id IS NULL THEN RETURN false; END IF;
 IF NOT EXISTS(SELECT 1 FROM identity.users u JOIN identity.memberships m ON m.user_id=u.id
 JOIN public.branches b ON b.id=m.branch_id WHERE u.id=lookup.user_id AND m.branch_id=device.branch_id
 AND u.disabled_at IS NULL AND u.phone_verified_at IS NOT NULL AND b.archived_at IS NULL) THEN RETURN false; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.services WHERE id=lookup.service_id AND branch_id=device.branch_id
 AND archived_at IS NULL AND completed_at IS NULL AND now() BETWEEN starts_at-interval '1 hour' AND ends_at) THEN RETURN false; END IF;
 SELECT id INTO member FROM public.members WHERE profile_id=lookup.user_id AND branch_id=device.branch_id AND archived_at IS NULL;
 IF member IS NULL THEN RETURN false; END IF;
 INSERT INTO public.attendance(branch_id,service_id,member_id) VALUES(device.branch_id,lookup.service_id,member) ON CONFLICT(service_id,member_id) DO NOTHING;
 UPDATE identity.tokens SET consumed_at=now() WHERE token_hash=lookup.token_hash;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION identity.kiosk_checkin(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION identity.kiosk_checkin(text,text) TO fgc_auth;
ALTER TABLE identity.tokens ADD COLUMN enrollment_secret text;

GRANT EXECUTE ON FUNCTION identity.actor(),identity.branch(),identity.has_capability(text) TO fgc_auth;
CREATE POLICY services_self_read ON public.services FOR SELECT TO fgc_runtime USING(branch_id=identity.branch());
