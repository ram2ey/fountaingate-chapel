-- Provision fgc_messaging (NOSUPERUSER, NOBYPASSRLS, NOINHERIT) before migration.
CREATE TABLE public.message_templates(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),branch_id uuid NOT NULL REFERENCES public.branches(id),created_by uuid NOT NULL REFERENCES identity.users(id),
 title text NOT NULL CHECK(length(title) BETWEEN 1 AND 100),body text NOT NULL CHECK(length(body) BETWEEN 1 AND 1600),version integer NOT NULL DEFAULT 1 CHECK(version>0),archived_at timestamptz,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.broadcasts(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),branch_id uuid NOT NULL REFERENCES public.branches(id),sender_id uuid NOT NULL REFERENCES identity.users(id),
 operation_id uuid NOT NULL UNIQUE,fingerprint text NOT NULL,channel text NOT NULL CHECK(channel='sms'),provider_sender text NOT NULL CHECK(length(provider_sender) BETWEEN 1 AND 11),
 body text NOT NULL CHECK(length(body) BETWEEN 1 AND 1600),cell_group text,recipient_count integer NOT NULL CHECK(recipient_count BETWEEN 1 AND 1000),created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(id,branch_id)
);
CREATE TABLE public.message_deliveries(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),branch_id uuid NOT NULL REFERENCES public.branches(id),broadcast_id uuid NOT NULL,member_id uuid NOT NULL,user_id uuid NOT NULL REFERENCES identity.users(id),
 phone text NOT NULL CHECK(phone ~ '^\+[1-9][0-9]{7,14}$'),state text NOT NULL DEFAULT 'queued' CHECK(state IN ('queued','sending','accepted','delivered','failed','uncertain','suppressed')),
 attempts integer NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 3),report_attempts integer NOT NULL DEFAULT 0 CHECK(report_attempts BETWEEN 0 AND 12),
 provider_campaign_id text UNIQUE,lease_token uuid,lease_until timestamptz,started_at timestamptz,next_attempt_at timestamptz DEFAULT now(),last_error text,
 accepted_at timestamptz,delivered_at timestamptz,updated_at timestamptz NOT NULL DEFAULT now(),created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(broadcast_id,branch_id) REFERENCES public.broadcasts(id,branch_id),FOREIGN KEY(member_id,branch_id) REFERENCES public.members(id,branch_id),UNIQUE(broadcast_id,phone)
);
CREATE INDEX delivery_queue_idx ON public.message_deliveries(next_attempt_at,id) WHERE state IN ('queued','accepted','uncertain','sending');
CREATE INDEX delivery_broadcast_idx ON public.message_deliveries(broadcast_id,id);
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['message_templates','broadcasts','message_deliveries'] LOOP
 EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY',t);
 EXECUTE format('CREATE POLICY communications_read ON public.%I FOR SELECT TO fgc_runtime USING(branch_id=identity.branch() AND identity.has_capability(''care''))',t);
 EXECUTE format('CREATE POLICY owner_maintenance ON public.%I TO %I USING(true) WITH CHECK(true)',t,current_user);
 END LOOP; END $$;
GRANT SELECT ON public.message_templates,public.broadcasts,public.message_deliveries TO fgc_runtime;
CREATE POLICY template_write ON public.message_templates FOR UPDATE TO fgc_runtime USING(branch_id=identity.branch() AND identity.has_capability('care')) WITH CHECK(branch_id=identity.branch() AND identity.has_capability('care'));
CREATE POLICY template_insert ON public.message_templates FOR INSERT TO fgc_runtime WITH CHECK(branch_id=identity.branch() AND created_by=identity.actor() AND identity.has_capability('care'));
GRANT INSERT ON public.message_templates TO fgc_runtime;
GRANT UPDATE(title,body,version,archived_at,updated_at) ON public.message_templates TO fgc_runtime;

CREATE FUNCTION identity.broadcast_recipients(p_cell text) RETURNS TABLE(member_id uuid,user_id uuid,phone text,donor_name text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,identity,public AS $$ BEGIN
 IF NOT identity.has_capability('care') THEN RAISE EXCEPTION 'Access denied'; END IF;
 RETURN QUERY SELECT DISTINCT ON(u.phone) m.id,u.id,u.phone,m.first_name||' '||m.last_name
 FROM public.members m JOIN identity.users u ON u.id=m.profile_id JOIN public.profiles p ON p.id=u.id JOIN public.notification_preferences n ON n.user_id=u.id
 JOIN identity.memberships a ON a.user_id=u.id AND a.branch_id=m.branch_id
 WHERE m.branch_id=identity.branch() AND m.archived_at IS NULL AND p.archived_at IS NULL AND u.disabled_at IS NULL AND u.phone_verified_at IS NOT NULL AND n.sms
 AND m.phone=u.phone AND u.phone ~ '^\+[1-9][0-9]{7,14}$' AND (p_cell IS NULL OR m.cell_group=p_cell) ORDER BY u.phone,m.id;
END $$;
REVOKE ALL ON FUNCTION identity.broadcast_recipients(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION identity.broadcast_recipients(text) TO fgc_runtime;

CREATE FUNCTION identity.queue_broadcast(p_operation uuid,p_fingerprint text,p_body text,p_cell text,p_sender text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,identity,public AS $$
DECLARE previous public.broadcasts; campaign uuid; recipients integer; BEGIN
 IF NOT identity.has_capability('care') THEN RAISE EXCEPTION 'Access denied'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation::text,601));
 SELECT * INTO previous FROM public.broadcasts WHERE operation_id=p_operation;
 IF previous.id IS NOT NULL THEN IF previous.branch_id<>identity.branch() OR previous.sender_id<>identity.actor() OR previous.fingerprint<>p_fingerprint THEN RAISE EXCEPTION 'Broadcast operation conflict'; END IF;RETURN previous.id;END IF;
 IF p_body IS NULL OR length(p_body) NOT BETWEEN 1 AND 1600 OR p_sender IS NULL OR length(p_sender) NOT BETWEEN 1 AND 11 THEN RAISE EXCEPTION 'Invalid broadcast'; END IF;
 IF p_cell IS NOT NULL AND length(p_cell) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Invalid cell group';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(identity.actor()::text,602));
 IF (SELECT count(*) FROM public.broadcasts WHERE sender_id=identity.actor() AND created_at>now()-interval '1 hour')>=10 THEN RAISE EXCEPTION 'Broadcast request limit reached'; END IF;
 SELECT count(*) INTO recipients FROM identity.broadcast_recipients(p_cell);
 IF recipients NOT BETWEEN 1 AND 1000 THEN RAISE EXCEPTION 'Choose a recipient group of 1 to 1000 opted-in members'; END IF;
 INSERT INTO public.broadcasts(branch_id,sender_id,operation_id,fingerprint,channel,provider_sender,body,cell_group,recipient_count) VALUES(identity.branch(),identity.actor(),p_operation,p_fingerprint,'sms',p_sender,p_body,p_cell,recipients) RETURNING id INTO campaign;
 INSERT INTO public.message_deliveries(branch_id,broadcast_id,member_id,user_id,phone) SELECT identity.branch(),campaign,member_id,user_id,phone FROM identity.broadcast_recipients(p_cell);
 -- Concurrent opt-outs may change the second snapshot; store the actual durable count.
 UPDATE public.broadcasts SET recipient_count=(SELECT count(*) FROM public.message_deliveries WHERE broadcast_id=campaign) WHERE id=campaign;
 INSERT INTO public.audit_events(branch_id,actor_id,action,entity_type,entity_id) VALUES(identity.branch(),identity.actor(),'queue_broadcast','broadcast',campaign);
 RETURN campaign;
END $$;
REVOKE ALL ON FUNCTION identity.queue_broadcast(uuid,text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION identity.queue_broadcast(uuid,text,text,text,text) TO fgc_runtime;

CREATE FUNCTION identity.delivery_eligible(p_delivery uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,identity,public AS $$
 SELECT EXISTS(SELECT 1 FROM public.message_deliveries d JOIN public.broadcasts b ON b.id=d.broadcast_id JOIN public.branches branch ON branch.id=b.branch_id
 JOIN public.members m ON m.id=d.member_id JOIN identity.users u ON u.id=d.user_id JOIN public.profiles p ON p.id=u.id JOIN public.notification_preferences n ON n.user_id=u.id
 JOIN identity.memberships membership ON membership.user_id=u.id AND membership.branch_id=d.branch_id
 JOIN identity.users sender ON sender.id=b.sender_id JOIN public.profiles sp ON sp.id=sender.id JOIN identity.memberships permission ON permission.user_id=sender.id AND permission.branch_id=b.branch_id
 WHERE d.id=p_delivery AND branch.archived_at IS NULL AND m.archived_at IS NULL AND p.archived_at IS NULL AND u.disabled_at IS NULL AND u.phone_verified_at IS NOT NULL AND n.sms
 AND m.profile_id=u.id AND m.phone=d.phone AND u.phone=d.phone AND sender.disabled_at IS NULL AND sp.archived_at IS NULL AND sender.phone_verified_at IS NOT NULL AND permission.role IN ('pastor','admin'))
$$;
REVOKE ALL ON FUNCTION identity.delivery_eligible(uuid) FROM PUBLIC;

GRANT USAGE ON SCHEMA identity TO fgc_messaging;
CREATE FUNCTION identity.claim_message() RETURNS TABLE(id uuid,lease_token uuid,work text,phone text,body text,provider_sender text,provider_campaign_id text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,identity,public AS $$ DECLARE job public.message_deliveries; campaign public.broadcasts; BEGIN
 UPDATE public.message_deliveries d SET state=CASE WHEN d.started_at IS NULL THEN 'queued' ELSE 'uncertain' END,lease_token=NULL,lease_until=NULL,last_error=CASE WHEN d.started_at IS NULL THEN 'Recovered before dispatch' ELSE 'Worker lost after dispatch started; reconcile provider history' END,updated_at=now()
 WHERE d.state='sending' AND d.lease_until<now();
 SELECT * INTO job FROM public.message_deliveries d WHERE (d.lease_until IS NULL OR d.lease_until<now()) AND d.next_attempt_at<=now()
 AND ((d.state='queued' AND d.attempts<3) OR (d.state IN ('accepted','uncertain') AND d.provider_campaign_id IS NOT NULL AND d.report_attempts<12)) ORDER BY d.next_attempt_at,d.id FOR UPDATE SKIP LOCKED LIMIT 1;
 IF job.id IS NULL THEN RETURN; END IF;
 SELECT * INTO campaign FROM public.broadcasts WHERE public.broadcasts.id=job.broadcast_id;
 IF job.state='queued' AND NOT identity.delivery_eligible(job.id) THEN UPDATE public.message_deliveries SET state='suppressed',last_error='Recipient opted out or account/sender access changed',next_attempt_at=NULL,updated_at=now() WHERE public.message_deliveries.id=job.id;RETURN;END IF;
 UPDATE public.message_deliveries SET lease_token=gen_random_uuid(),lease_until=now()+interval '90 seconds',state=CASE WHEN state='queued' THEN 'sending' ELSE state END,started_at=CASE WHEN state='queued' THEN NULL ELSE started_at END,updated_at=now() WHERE public.message_deliveries.id=job.id RETURNING * INTO job;
 RETURN QUERY SELECT job.id,job.lease_token,CASE WHEN job.state='sending' THEN 'send' ELSE 'report' END,job.phone,campaign.body,campaign.provider_sender,job.provider_campaign_id;
END $$;
REVOKE ALL ON FUNCTION identity.claim_message() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION identity.claim_message() TO fgc_messaging;

CREATE FUNCTION identity.begin_message(p_id uuid,p_lease uuid,p_sender text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,identity,public AS $$
DECLARE d public.message_deliveries; BEGIN
 SELECT * INTO d FROM public.message_deliveries WHERE id=p_id FOR UPDATE;
 IF d.id IS NULL OR d.state<>'sending' OR d.lease_token IS DISTINCT FROM p_lease OR d.lease_until<=now() OR d.started_at IS NOT NULL OR d.attempts>=3 THEN RETURN false;END IF;
 IF NOT identity.delivery_eligible(d.id) OR NOT EXISTS(SELECT 1 FROM public.broadcasts b WHERE b.id=d.broadcast_id AND b.provider_sender=p_sender) THEN
 UPDATE public.message_deliveries SET state='suppressed',lease_token=NULL,lease_until=NULL,next_attempt_at=NULL,last_error='Consent, sender access or configured sender changed',updated_at=now() WHERE id=d.id;RETURN false;END IF;
 UPDATE public.message_deliveries SET started_at=now(),attempts=attempts+1,updated_at=now() WHERE id=d.id;RETURN true;
END $$;
REVOKE ALL ON FUNCTION identity.begin_message(uuid,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION identity.begin_message(uuid,uuid,text) TO fgc_messaging;

CREATE FUNCTION identity.finish_message(p_id uuid,p_lease uuid,p_result text,p_campaign text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,identity,public AS $$ DECLARE d public.message_deliveries; BEGIN
 SELECT * INTO d FROM public.message_deliveries WHERE id=p_id FOR UPDATE;
 IF d.id IS NULL OR d.lease_token IS DISTINCT FROM p_lease OR d.lease_until<=now() THEN RETURN false;END IF;
 IF d.state='sending' THEN
  IF d.started_at IS NULL OR p_result NOT IN ('accepted','rejected','uncertain') THEN RAISE EXCEPTION 'Invalid send result';END IF;
  IF p_result='accepted' AND (p_campaign IS NULL OR length(p_campaign) NOT BETWEEN 1 AND 128) THEN RAISE EXCEPTION 'Missing provider campaign';END IF;
  UPDATE public.message_deliveries SET state=CASE p_result WHEN 'rejected' THEN 'failed' ELSE p_result END,provider_campaign_id=CASE WHEN p_result='accepted' THEN p_campaign ELSE NULL END,
   accepted_at=CASE WHEN p_result='accepted' THEN now() ELSE NULL END,last_error=CASE p_result WHEN 'rejected' THEN 'Provider explicitly rejected this send' WHEN 'uncertain' THEN 'Send outcome uncertain; reconcile provider history before retrying' ELSE NULL END,
   next_attempt_at=CASE WHEN p_result='accepted' THEN now()+interval '30 seconds' ELSE NULL END,lease_token=NULL,lease_until=NULL,updated_at=now() WHERE id=d.id;
 ELSE
  IF d.state NOT IN ('accepted','uncertain') OR p_result NOT IN ('delivered','failed','accepted','unknown') THEN RAISE EXCEPTION 'Invalid report result';END IF;
  UPDATE public.message_deliveries SET state=CASE WHEN p_result IN ('delivered','failed','accepted') THEN p_result ELSE state END,report_attempts=report_attempts+1,
   delivered_at=CASE WHEN p_result='delivered' THEN now() ELSE delivered_at END,accepted_at=CASE WHEN p_result IN ('delivered','accepted') THEN coalesce(accepted_at,now()) ELSE accepted_at END,
   last_error=CASE WHEN p_result='failed' THEN 'Provider delivery report confirms failure' WHEN p_result='unknown' THEN 'Report unavailable or does not match the saved recipient/message/sender' ELSE NULL END,
   next_attempt_at=CASE WHEN p_result IN ('delivered','failed') OR report_attempts+1>=12 THEN NULL ELSE now()+make_interval(secs=>least(3600,30*power(2,report_attempts)::integer)) END,lease_token=NULL,lease_until=NULL,updated_at=now() WHERE id=d.id;
 END IF;
 INSERT INTO public.audit_events(branch_id,actor_id,action,entity_type,entity_id) SELECT b.branch_id,b.sender_id,'delivery_'||p_result,'delivery',d.id FROM public.broadcasts b WHERE b.id=d.broadcast_id;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION identity.finish_message(uuid,uuid,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION identity.finish_message(uuid,uuid,text,text) TO fgc_messaging;

CREATE FUNCTION identity.retry_message(p_id uuid,p_reason text,p_campaign text DEFAULT NULL,p_reconcile boolean DEFAULT false) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,identity,public AS $$ DECLARE d public.message_deliveries; BEGIN
 IF NOT identity.has_capability('care') THEN RAISE EXCEPTION 'Access denied';END IF;
 SELECT * INTO d FROM public.message_deliveries WHERE id=p_id AND branch_id=identity.branch() FOR UPDATE;
 IF d.id IS NULL OR p_reason IS NULL OR length(p_reason) NOT BETWEEN 1 AND 300 OR (d.lease_until IS NOT NULL AND d.lease_until>now()) THEN RAISE EXCEPTION 'Delivery unavailable or busy';END IF;
 IF d.state='failed' AND d.attempts<3 AND p_campaign IS NULL AND NOT p_reconcile THEN
  IF NOT identity.delivery_eligible(d.id) THEN RAISE EXCEPTION 'Recipient or sender no longer eligible';END IF;
  UPDATE public.message_deliveries SET state='queued',provider_campaign_id=NULL,started_at=NULL,report_attempts=0,next_attempt_at=now()+make_interval(secs=>60*power(2,d.attempts)::integer),last_error=NULL,updated_at=now() WHERE id=d.id;
 ELSIF d.state IN ('accepted','uncertain') THEN
  IF d.state='uncertain' AND d.provider_campaign_id IS NULL AND (p_campaign IS NULL OR p_campaign !~ '^[A-Za-z0-9_-]{1,128}$') THEN RAISE EXCEPTION 'A provider history campaign reference is required';END IF;
  IF d.provider_campaign_id IS NOT NULL AND p_campaign IS NOT NULL AND d.provider_campaign_id<>p_campaign THEN RAISE EXCEPTION 'Provider reference conflict';END IF;
  UPDATE public.message_deliveries SET provider_campaign_id=coalesce(provider_campaign_id,p_campaign),report_attempts=0,next_attempt_at=now(),last_error=NULL,updated_at=now() WHERE id=d.id;
 ELSE RAISE EXCEPTION 'Only failed deliveries can be resent; uncertain or accepted sends require reconciliation';END IF;
 INSERT INTO public.audit_events(branch_id,actor_id,action,entity_type,entity_id) VALUES(d.branch_id,identity.actor(),'retry_or_reconcile: '||p_reason,'delivery',d.id);
END $$;
REVOKE ALL ON FUNCTION identity.retry_message(uuid,text,text,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION identity.retry_message(uuid,text,text,boolean) TO fgc_runtime;
