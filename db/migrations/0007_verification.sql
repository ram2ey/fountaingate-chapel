ALTER TABLE identity.tokens ADD COLUMN enrollment_name text;
CREATE FUNCTION identity.finalize_member(uid uuid,p_branch uuid,p_name text,p_hash text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,identity,public AS $$
DECLARE phone_number text; BEGIN
 SELECT phone INTO phone_number FROM identity.users WHERE id=uid AND phone_verified_at IS NULL AND disabled_at IS NULL FOR UPDATE;
 IF phone_number IS NULL OR NOT EXISTS(SELECT 1 FROM public.branches WHERE id=p_branch AND registration_enabled AND archived_at IS NULL) THEN RETURN false; END IF;
 UPDATE identity.users SET phone_verified_at=now(),password_hash=p_hash,updated_at=now() WHERE id=uid;
 UPDATE public.profiles SET full_name=p_name,updated_at=now() WHERE id=uid;
 DELETE FROM identity.memberships WHERE user_id=uid;
 INSERT INTO identity.memberships(user_id,branch_id,role) VALUES(uid,p_branch,'member');
 INSERT INTO public.members(branch_id,profile_id,first_name,last_name,phone) VALUES(p_branch,uid,p_name,'',phone_number);
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION identity.finalize_member(uuid,uuid,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION identity.finalize_member(uuid,uuid,text,text) TO fgc_auth;
