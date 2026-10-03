ALTER TABLE public.services ADD COLUMN event_type text NOT NULL DEFAULT 'service' CHECK(event_type IN ('service','cell','vigil')), ADD COLUMN cell_group text;
ALTER TABLE public.services ADD CHECK(event_type<>'cell' OR length(cell_group)>0);
ALTER TABLE public.members ADD COLUMN attendance_expected_from timestamptz NOT NULL DEFAULT now(), ADD COLUMN attendance_expected_until timestamptz, ADD COLUMN consecutive_absences integer NOT NULL DEFAULT 0 CHECK(consecutive_absences>=0);
UPDATE public.members SET attendance_expected_from=created_at;
ALTER TABLE public.members ADD CHECK(attendance_expected_until IS NULL OR attendance_expected_until>=attendance_expected_from);
ALTER TABLE public.attendance ADD COLUMN present boolean NOT NULL DEFAULT true, ADD COLUMN recorded_at timestamptz NOT NULL DEFAULT now(), ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
UPDATE public.attendance SET present=false WHERE excused;
ALTER TABLE public.attendance ADD CHECK(NOT(present AND excused));
CREATE TABLE public.service_expectations(
 branch_id uuid NOT NULL REFERENCES public.branches(id), service_id uuid NOT NULL, member_id uuid NOT NULL,
 PRIMARY KEY(service_id,member_id), FOREIGN KEY(service_id,branch_id) REFERENCES public.services(id,branch_id), FOREIGN KEY(member_id,branch_id) REFERENCES public.members(id,branch_id)
);
CREATE TABLE public.attendance_operations(
 id uuid PRIMARY KEY, branch_id uuid NOT NULL REFERENCES public.branches(id), actor_id uuid NOT NULL REFERENCES identity.users(id), fingerprint text NOT NULL, attendance_id uuid NOT NULL REFERENCES public.attendance(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE identity.kiosk_receipts(
 operation_id uuid PRIMARY KEY, device_id uuid NOT NULL REFERENCES identity.kiosk_devices(id), fingerprint text NOT NULL, attendance_id uuid NOT NULL REFERENCES public.attendance(id), created_at timestamptz NOT NULL DEFAULT now()
);
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['service_expectations','attendance_operations'] LOOP
 EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY',t);
 EXECUTE format('CREATE POLICY staff_read ON public.%I FOR SELECT TO fgc_runtime USING(branch_id=identity.branch() AND identity.has_capability(''attendance''))',t);
 EXECUTE format('CREATE POLICY owner_maintenance ON public.%I TO %I USING(true) WITH CHECK(true)',t,current_user);
 END LOOP; END $$;
CREATE POLICY self_read ON public.service_expectations FOR SELECT TO fgc_runtime USING(branch_id=identity.branch() AND EXISTS(SELECT 1 FROM public.members m WHERE m.id=member_id AND m.profile_id=identity.actor()));
CREATE POLICY operation_insert ON public.attendance_operations FOR INSERT TO fgc_runtime WITH CHECK(branch_id=identity.branch() AND actor_id=identity.actor() AND identity.has_capability('attendance'));
GRANT SELECT ON public.service_expectations TO fgc_runtime;
GRANT SELECT,INSERT ON public.attendance_operations TO fgc_runtime;
GRANT UPDATE(event_type,cell_group) ON public.services TO fgc_runtime;
GRANT UPDATE(attendance_expected_from,attendance_expected_until,household_id) ON public.members TO fgc_runtime;
GRANT UPDATE(present,recorded_at,updated_at) ON public.attendance TO fgc_runtime;
CREATE INDEX services_completion_idx ON public.services(ends_at,branch_id) WHERE completed_at IS NULL AND archived_at IS NULL;
CREATE INDEX expectations_member_idx ON public.service_expectations(member_id,service_id);

-- Rebuild derived streaks from durable expectations, never increment a counter per job run.
CREATE FUNCTION identity.rebuild_attendance(p_branch uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,identity,public AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(p_branch::text,410));
 WITH streaks AS (
  SELECT e.member_id,coalesce(a.present OR a.excused,false) AS attended,
   sum(CASE WHEN a.present OR a.excused THEN 1 ELSE 0 END) OVER(PARTITION BY e.member_id ORDER BY s.starts_at DESC,s.id DESC) AS stops
  FROM public.service_expectations e JOIN public.services s ON s.id=e.service_id
  LEFT JOIN public.attendance a ON a.service_id=e.service_id AND a.member_id=e.member_id
  WHERE e.branch_id=p_branch AND s.completed_at IS NOT NULL AND s.archived_at IS NULL
 ), counts AS (SELECT member_id,count(*) FILTER(WHERE stops=0 AND NOT attended)::integer AS missed FROM streaks GROUP BY member_id)
 UPDATE public.members m SET consecutive_absences=coalesce((SELECT missed FROM counts WHERE member_id=m.id),0),
  status=CASE WHEN m.status IN ('active','at_risk') THEN CASE WHEN coalesce((SELECT missed FROM counts WHERE member_id=m.id),0)>=3 THEN 'at_risk' ELSE 'active' END ELSE m.status END,updated_at=now()
 WHERE m.branch_id=p_branch AND m.archived_at IS NULL;
END $$;
REVOKE ALL ON FUNCTION identity.rebuild_attendance(uuid) FROM PUBLIC;

CREATE FUNCTION identity.complete_service(p_id uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,identity,public AS $$
DECLARE s public.services; BEGIN
 SELECT * INTO s FROM public.services WHERE id=p_id;
 IF s.id IS NULL OR s.archived_at IS NOT NULL OR s.ends_at>now() THEN RETURN false; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(s.branch_id::text,410));
 SELECT * INTO s FROM public.services WHERE id=p_id FOR UPDATE;
 IF s.completed_at IS NULL THEN
  IF s.attendance_eligible THEN
   INSERT INTO public.service_expectations(branch_id,service_id,member_id)
   SELECT s.branch_id,s.id,m.id FROM public.members m WHERE m.branch_id=s.branch_id AND m.archived_at IS NULL
    AND (m.status IN ('active','at_risk') OR (m.status IN ('inactive','transferred') AND m.attendance_expected_until IS NOT NULL)) AND m.attendance_expected_from<=s.starts_at
    AND (m.attendance_expected_until IS NULL OR m.attendance_expected_until>s.starts_at)
    AND (s.event_type<>'cell' OR m.cell_group=s.cell_group) ON CONFLICT DO NOTHING;
  END IF;
  UPDATE public.services SET completed_at=now() WHERE id=s.id;
 END IF;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION identity.complete_service(uuid) FROM PUBLIC;

-- Only the maintenance owner may execute this bounded, restart-safe job.
CREATE FUNCTION identity.reconcile_attendance(p_limit integer DEFAULT 100) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,identity,public AS $$
DECLARE s record; n integer:=0; BEGIN
 IF p_limit NOT BETWEEN 1 AND 500 THEN RAISE EXCEPTION 'Invalid job limit'; END IF;
 PERFORM pg_advisory_xact_lock(74120401);
 FOR s IN SELECT id,branch_id FROM public.services WHERE completed_at IS NULL AND archived_at IS NULL AND ends_at<=now() ORDER BY ends_at,id LIMIT p_limit LOOP
  PERFORM identity.complete_service(s.id); PERFORM identity.rebuild_attendance(s.branch_id); n:=n+1;
 END LOOP;
 RETURN n;
END $$;
REVOKE ALL ON FUNCTION identity.reconcile_attendance(integer) FROM PUBLIC;
CREATE FUNCTION identity.refresh_branch_attendance() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,identity,public AS $$
BEGIN
 IF NOT identity.has_capability('attendance') THEN RAISE EXCEPTION 'Access denied'; END IF;
 PERFORM identity.rebuild_attendance(identity.branch());
END $$;
REVOKE ALL ON FUNCTION identity.refresh_branch_attendance() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION identity.refresh_branch_attendance() TO fgc_runtime;

-- Durable receipts make a lost acknowledgement safe to retry; token replay under a new operation is denied.
CREATE FUNCTION identity.kiosk_upload(p_device text,p_token text,p_operation uuid,p_service uuid,p_recorded timestamptz) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,identity,public AS $$
DECLARE d identity.kiosk_devices; t identity.tokens; receipt identity.kiosk_receipts; mid uuid; aid uuid; fp text; s public.services; BEGIN
 SELECT * INTO d FROM identity.kiosk_devices WHERE token_hash=encode(sha256(convert_to(p_device,'UTF8')),'hex') AND revoked_at IS NULL AND expires_at>now() FOR SHARE;
 IF d.id IS NULL THEN RETURN NULL; END IF;
 fp:=encode(sha256(convert_to(p_token||':'||p_service::text||':'||p_recorded::text,'UTF8')),'hex');
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation::text,411));
 SELECT * INTO receipt FROM identity.kiosk_receipts WHERE operation_id=p_operation;
 IF receipt.operation_id IS NOT NULL THEN IF receipt.device_id=d.id AND receipt.fingerprint=fp THEN RETURN receipt.attendance_id; ELSE RETURN NULL; END IF; END IF;
 SELECT * INTO t FROM identity.tokens WHERE token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex') AND purpose='kiosk_lookup' AND branch_id=d.branch_id AND service_id=p_service AND consumed_at IS NULL FOR UPDATE;
 IF t.user_id IS NULL OR p_recorded<t.created_at OR p_recorded>t.expires_at OR p_recorded>now()+interval '30 seconds' THEN RETURN NULL; END IF;
 SELECT * INTO s FROM public.services WHERE id=p_service AND branch_id=d.branch_id AND archived_at IS NULL;
 IF s.id IS NULL OR p_recorded NOT BETWEEN s.starts_at-interval '1 hour' AND s.ends_at OR now()>s.ends_at+interval '7 days' THEN RETURN NULL; END IF;
 IF NOT EXISTS(SELECT 1 FROM identity.users u JOIN identity.memberships x ON x.user_id=u.id JOIN public.branches b ON b.id=x.branch_id JOIN public.profiles p ON p.id=u.id WHERE u.id=t.user_id AND x.branch_id=d.branch_id AND u.disabled_at IS NULL AND u.phone_verified_at IS NOT NULL AND b.archived_at IS NULL AND p.archived_at IS NULL) THEN RETURN NULL; END IF;
 SELECT id INTO mid FROM public.members WHERE profile_id=t.user_id AND branch_id=d.branch_id AND archived_at IS NULL;
 IF mid IS NULL THEN RETURN NULL; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(d.branch_id::text,410));
 INSERT INTO public.attendance(branch_id,service_id,member_id,recorded_at) VALUES(d.branch_id,s.id,mid,p_recorded)
 ON CONFLICT(service_id,member_id) DO NOTHING RETURNING id INTO aid;
 IF aid IS NULL THEN SELECT id INTO aid FROM public.attendance WHERE service_id=s.id AND member_id=mid; END IF;
 UPDATE identity.tokens SET consumed_at=now() WHERE token_hash=t.token_hash;
 INSERT INTO identity.kiosk_receipts(operation_id,device_id,fingerprint,attendance_id) VALUES(p_operation,d.id,fp,aid);
 INSERT INTO identity.audit_events(branch_id,user_id,action,entity_id) VALUES(d.branch_id,t.user_id,'kiosk_attendance',aid);
 IF s.completed_at IS NOT NULL THEN PERFORM identity.rebuild_attendance(d.branch_id); END IF;
 RETURN aid;
END $$;
REVOKE ALL ON FUNCTION identity.kiosk_upload(text,text,uuid,uuid,timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION identity.kiosk_upload(text,text,uuid,uuid,timestamptz) TO fgc_auth;

-- The compatibility endpoint also uses the receipt/audit/recalculation path.
CREATE OR REPLACE FUNCTION identity.kiosk_checkin(device_token text,lookup_token text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,identity,public AS $$
DECLARE sid uuid; BEGIN
 SELECT service_id INTO sid FROM identity.tokens WHERE token_hash=encode(sha256(convert_to(lookup_token,'UTF8')),'hex') AND purpose='kiosk_lookup';
 IF sid IS NULL THEN RETURN false; END IF;
 RETURN identity.kiosk_upload(device_token,lookup_token,gen_random_uuid(),sid,now()) IS NOT NULL;
END $$;
