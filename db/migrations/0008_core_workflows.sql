ALTER TABLE public.branches ADD COLUMN guest_intake_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE identity.audit_events ADD COLUMN entity_id uuid;
CREATE TABLE identity.intake_requests (
 key_hash text PRIMARY KEY, fingerprint text NOT NULL, branch_id uuid NOT NULL REFERENCES public.branches(id),
 member_id uuid NOT NULL REFERENCES public.members(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.guest_prayers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), branch_id uuid NOT NULL REFERENCES public.branches(id), member_id uuid NOT NULL,
 body text NOT NULL CHECK(length(body) BETWEEN 1 AND 3000), created_at timestamptz NOT NULL DEFAULT now(), archived_at timestamptz,
 FOREIGN KEY(member_id,branch_id) REFERENCES public.members(id,branch_id)
);
ALTER TABLE public.guest_prayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_prayers FORCE ROW LEVEL SECURITY;
CREATE POLICY guest_prayer_read ON public.guest_prayers FOR SELECT TO fgc_runtime USING(branch_id=identity.branch() AND identity.has_capability('confidential_care') AND EXISTS(SELECT 1 FROM public.members m WHERE m.id=member_id AND m.archived_at IS NULL));
DO $$ BEGIN EXECUTE format('CREATE POLICY owner_maintenance ON public.guest_prayers TO %I USING(true) WITH CHECK(true)',current_user); END $$;
GRANT SELECT ON public.guest_prayers TO fgc_runtime;
CREATE INDEX guest_prayers_branch_idx ON public.guest_prayers(branch_id,created_at,id);
CREATE FUNCTION identity.submit_guest(p_key text,p_fingerprint text,p_branch uuid,p_first text,p_last text,p_phone text,p_consent boolean,p_prayer text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,identity,public AS $$
DECLARE prior identity.intake_requests; mid uuid; BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(p_key,0));
 SELECT * INTO prior FROM identity.intake_requests WHERE key_hash=p_key;
 IF prior.member_id IS NOT NULL THEN
  IF prior.fingerprint<>p_fingerprint THEN RAISE EXCEPTION 'Idempotency conflict' USING ERRCODE='22023'; END IF;
  RETURN prior.member_id;
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.branches WHERE id=p_branch AND guest_intake_enabled AND archived_at IS NULL) THEN RAISE EXCEPTION 'Intake unavailable'; END IF;
 IF length(p_first) NOT BETWEEN 1 AND 80 OR length(p_last)>80 OR p_phone !~ '^\+[1-9][0-9]{7,14}$' THEN RAISE EXCEPTION 'Invalid intake'; END IF;
 INSERT INTO public.members(branch_id,first_name,last_name,phone,status) VALUES(p_branch,p_first,p_last,p_phone,'first_time_guest') RETURNING id INTO mid;
 INSERT INTO public.guest_followups(branch_id,member_id,consent_to_contact) VALUES(p_branch,mid,p_consent);
 IF p_prayer IS NOT NULL THEN INSERT INTO public.guest_prayers(branch_id,member_id,body) VALUES(p_branch,mid,p_prayer); END IF;
 INSERT INTO identity.intake_requests(key_hash,fingerprint,branch_id,member_id) VALUES(p_key,p_fingerprint,p_branch,mid);
 INSERT INTO identity.audit_events(branch_id,action,entity_id) VALUES(p_branch,'guest_intake',mid);
 RETURN mid;
END $$;
REVOKE ALL ON FUNCTION identity.submit_guest(text,text,uuid,text,text,text,boolean,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION identity.submit_guest(text,text,uuid,text,text,text,boolean,text) TO fgc_auth;

-- Personal prayers stay with their owner and pastors; private content is not exposed to general administrators.
DROP POLICY prayer_read ON public.prayers;
CREATE POLICY prayer_read ON public.prayers FOR SELECT TO fgc_runtime USING(branch_id=identity.branch() AND (author_id=identity.actor() OR (visibility='branch' AND archived_at IS NULL) OR identity.has_capability('confidential_care')));
DROP POLICY prayer_update ON public.prayers;
CREATE POLICY prayer_update ON public.prayers FOR UPDATE TO fgc_runtime USING(branch_id=identity.branch() AND (author_id=identity.actor() OR identity.has_capability('confidential_care'))) WITH CHECK(branch_id=identity.branch() AND (author_id=identity.actor() OR identity.has_capability('confidential_care')));
-- Reactions on archived prayers are unavailable, regardless of owner/moderator.
DROP POLICY prayer_child_insert ON public.prayer_reactions;
CREATE POLICY prayer_child_insert ON public.prayer_reactions FOR INSERT TO fgc_runtime WITH CHECK(branch_id=identity.branch() AND user_id=identity.actor() AND EXISTS(SELECT 1 FROM public.prayers p WHERE p.id=prayer_id AND p.archived_at IS NULL));
DROP POLICY prayer_child_insert ON public.prayer_updates;
CREATE POLICY prayer_child_insert ON public.prayer_updates FOR INSERT TO fgc_runtime WITH CHECK(branch_id=identity.branch() AND author_id=identity.actor() AND EXISTS(SELECT 1 FROM public.prayers p WHERE p.id=prayer_id AND p.archived_at IS NULL AND (p.author_id=identity.actor() OR identity.has_capability('confidential_care'))));
DROP POLICY care_read ON public.care_notes;
CREATE POLICY care_read ON public.care_notes FOR SELECT TO fgc_runtime USING(branch_id=identity.branch() AND identity.has_capability(CASE WHEN confidential THEN 'confidential_care' ELSE 'care' END) AND EXISTS(SELECT 1 FROM public.members m WHERE m.id=member_id AND m.archived_at IS NULL));
