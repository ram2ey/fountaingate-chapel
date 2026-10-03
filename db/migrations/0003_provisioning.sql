-- A narrow identity function provisions one member account; it cannot grant staff.
-- Trusted migration owner retains maintenance access despite FORCE RLS.
DO $$ DECLARE t text; BEGIN
 FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename<>'schema_migrations' LOOP
  EXECUTE format('CREATE POLICY owner_maintenance ON public.%I TO %I USING(true) WITH CHECK(true)',t,current_user);
 END LOOP;
END $$;
CREATE POLICY auth_branches ON public.branches FOR SELECT TO fgc_auth USING(true);
CREATE POLICY auth_profiles ON public.profiles FOR SELECT TO fgc_auth USING(true);
CREATE FUNCTION identity.register_member(p_phone text,p_password_hash text,p_name text,p_branch uuid) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,identity,public AS $$
DECLARE uid uuid; BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.branches WHERE id=p_branch AND registration_enabled AND archived_at IS NULL) THEN
  RAISE EXCEPTION 'Registration unavailable';
 END IF;
 INSERT INTO identity.users(phone,password_hash) VALUES(p_phone,p_password_hash) RETURNING id INTO uid;
 INSERT INTO public.profiles(id,full_name) VALUES(uid,p_name);
 INSERT INTO identity.memberships(user_id,branch_id,role) VALUES(uid,p_branch,'member');
 RETURN uid;
END $$;
REVOKE ALL ON FUNCTION identity.register_member(text,text,text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION identity.register_member(text,text,text,uuid) TO fgc_auth;
