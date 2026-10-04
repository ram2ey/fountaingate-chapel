CREATE TABLE public.payment_attempts(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),branch_id uuid NOT NULL REFERENCES public.branches(id),actor_id uuid NOT NULL REFERENCES identity.users(id),member_id uuid,
 operation_id uuid NOT NULL UNIQUE,fingerprint text NOT NULL,provider text NOT NULL CHECK(provider='hubtel'),reference text NOT NULL UNIQUE,
 amount_minor bigint NOT NULL CHECK(amount_minor BETWEEN 1 AND 100000000000),currency text NOT NULL CHECK(currency='GHS'),fund text NOT NULL CHECK(length(fund) BETWEEN 1 AND 100),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','failed','refunded')),checkout_url text,provider_transaction_id text UNIQUE,
 refunded_minor bigint NOT NULL DEFAULT 0 CHECK(refunded_minor>=0 AND refunded_minor<=amount_minor),verified_at timestamptz,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(member_id,branch_id) REFERENCES public.members(id,branch_id)
);
CREATE TABLE public.ledger_entries(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),branch_id uuid NOT NULL REFERENCES public.branches(id),member_id uuid,recorded_by uuid NOT NULL REFERENCES identity.users(id),
 operation_id uuid NOT NULL UNIQUE,fingerprint text NOT NULL,kind text NOT NULL CHECK(kind IN ('credit','reversal','refund')),
 amount_minor bigint NOT NULL CHECK(amount_minor<>0 AND abs(amount_minor::numeric)<=100000000000),currency text NOT NULL CHECK(currency ~ '^[A-Z]{3}$'),fund text NOT NULL CHECK(length(fund) BETWEEN 1 AND 100),method text NOT NULL CHECK(length(method) BETWEEN 1 AND 40),reference text NOT NULL CHECK(length(reference) BETWEEN 1 AND 200),
 payment_id uuid REFERENCES public.payment_attempts(id),reversal_of uuid REFERENCES public.ledger_entries(id),reason text NOT NULL,
 given_at timestamptz NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),
 CHECK((kind='credit' AND amount_minor>0 AND reversal_of IS NULL) OR (kind IN ('reversal','refund') AND amount_minor<0 AND reversal_of IS NOT NULL)),
 FOREIGN KEY(member_id,branch_id) REFERENCES public.members(id,branch_id),UNIQUE(id,branch_id)
);
CREATE UNIQUE INDEX ledger_payment_credit ON public.ledger_entries(payment_id) WHERE kind='credit';
CREATE UNIQUE INDEX ledger_manual_reference ON public.ledger_entries(branch_id,reference) WHERE method IN ('cash','bank');
CREATE INDEX ledger_scope_idx ON public.ledger_entries(branch_id,given_at,id);
CREATE INDEX ledger_member_idx ON public.ledger_entries(member_id,given_at,id);
CREATE INDEX ledger_reversal_idx ON public.ledger_entries(reversal_of);
CREATE TABLE identity.payment_events(
 event_hash text PRIMARY KEY,reference text NOT NULL,created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT ON identity.payment_events TO fgc_auth;
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['payment_attempts','ledger_entries'] LOOP
 EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY',t);
 EXECUTE format('CREATE POLICY finance_read ON public.%I FOR SELECT TO fgc_runtime USING(branch_id=identity.branch() AND identity.has_capability(''finance''))',t);
 EXECUTE format('CREATE POLICY owner_maintenance ON public.%I TO %I USING(true) WITH CHECK(true)',t,current_user);
 END LOOP; END $$;
CREATE POLICY attempt_self ON public.payment_attempts FOR SELECT TO fgc_runtime USING(branch_id=identity.branch() AND actor_id=identity.actor());
CREATE POLICY ledger_self ON public.ledger_entries FOR SELECT TO fgc_runtime USING(branch_id=identity.branch() AND EXISTS(SELECT 1 FROM public.members m WHERE m.id=member_id AND m.profile_id=identity.actor()));
CREATE POLICY attempt_insert ON public.payment_attempts FOR INSERT TO fgc_runtime WITH CHECK(branch_id=identity.branch() AND actor_id=identity.actor() AND fund IN ('tithe','offering','building_fund','missions','special_seed','other') AND status='pending' AND checkout_url IS NULL AND provider_transaction_id IS NULL AND refunded_minor=0 AND verified_at IS NULL AND (member_id IS NULL OR EXISTS(SELECT 1 FROM public.members m WHERE m.id=member_id AND m.profile_id=identity.actor() AND m.archived_at IS NULL)));
CREATE POLICY ledger_insert ON public.ledger_entries FOR INSERT TO fgc_runtime WITH CHECK(branch_id=identity.branch() AND recorded_by=identity.actor() AND identity.has_capability('finance') AND payment_id IS NULL AND ((kind='credit' AND method IN ('cash','bank') AND fund IN ('tithe','offering','building_fund','missions','special_seed','other')) OR (kind='reversal' AND method='adjustment')));
GRANT SELECT,INSERT ON public.payment_attempts,public.ledger_entries TO fgc_runtime;
-- Legacy records are preserved and migrated exactly once; new writes use the immutable ledger.
INSERT INTO public.ledger_entries(id,branch_id,member_id,recorded_by,operation_id,fingerprint,kind,amount_minor,currency,fund,method,reference,reason,given_at,created_at)
 SELECT id,branch_id,member_id,recorded_by,id,'legacy','credit',amount_minor,currency,fund,'legacy',coalesce(reference,'legacy-'||id::text),'Imported retained contribution; original method: '||method,given_at,created_at FROM public.contributions;
REVOKE INSERT ON public.contributions FROM fgc_runtime;

CREATE FUNCTION identity.guard_ledger() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,identity,public AS $$
DECLARE original public.ledger_entries; total bigint; BEGIN
 IF NEW.kind<>'credit' THEN
  SELECT * INTO original FROM public.ledger_entries WHERE id=NEW.reversal_of FOR UPDATE;
  IF original.id IS NULL OR original.kind<>'credit' OR original.branch_id<>NEW.branch_id OR original.currency<>NEW.currency OR original.member_id IS DISTINCT FROM NEW.member_id OR original.fund<>NEW.fund OR original.payment_id IS DISTINCT FROM NEW.payment_id THEN RAISE EXCEPTION 'Invalid adjustment'; END IF;
  IF original.payment_id IS NOT NULL AND NEW.kind<>'refund' THEN RAISE EXCEPTION 'Online payments require verified refunds'; END IF;
  SELECT coalesce(-sum(amount_minor),0) INTO total FROM public.ledger_entries WHERE reversal_of=original.id;
  IF total-NEW.amount_minor>original.amount_minor THEN RAISE EXCEPTION 'Adjustment exceeds original amount'; END IF;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION identity.guard_ledger() FROM PUBLIC;
CREATE TRIGGER ledger_guard BEFORE INSERT ON public.ledger_entries FOR EACH ROW EXECUTE FUNCTION identity.guard_ledger();

-- Only the identity process can post independently verified provider outcomes.
CREATE FUNCTION identity.post_verified_payment(p_reference text,p_transaction text,p_amount bigint,p_currency text,p_state text,p_paid_at timestamptz,p_refunded bigint,p_event text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,identity,public AS $$
DECLARE attempt public.payment_attempts; credit public.ledger_entries; delta bigint; BEGIN
 SELECT * INTO attempt FROM public.payment_attempts WHERE reference=p_reference FOR UPDATE;
 IF attempt.id IS NULL OR p_amount IS NULL OR p_currency IS NULL OR attempt.amount_minor<>p_amount OR attempt.currency<>p_currency OR p_transaction IS NULL OR p_transaction='' THEN RAISE EXCEPTION 'Payment mismatch'; END IF;
 IF attempt.provider_transaction_id IS NOT NULL AND attempt.provider_transaction_id<>p_transaction THEN RAISE EXCEPTION 'Transaction conflict'; END IF;
 IF p_state IS NULL OR p_refunded IS NULL OR p_state NOT IN ('success','reversed','failed','pending') OR p_refunded<0 OR p_refunded>p_amount THEN RAISE EXCEPTION 'Invalid provider state'; END IF;
 IF EXISTS(SELECT 1 FROM identity.payment_events WHERE event_hash=p_event) THEN UPDATE public.payment_attempts SET verified_at=now() WHERE id=attempt.id;RETURN attempt.id; END IF;
 IF p_state IN ('success','reversed') THEN
  IF p_paid_at IS NULL THEN RAISE EXCEPTION 'Missing payment date'; END IF;
  INSERT INTO public.ledger_entries(branch_id,member_id,recorded_by,operation_id,fingerprint,kind,amount_minor,currency,fund,method,reference,payment_id,reason,given_at)
   VALUES(attempt.branch_id,attempt.member_id,attempt.actor_id,attempt.id,'provider','credit',attempt.amount_minor,attempt.currency,attempt.fund,'hubtel',attempt.reference,attempt.id,'Verified provider payment',p_paid_at) ON CONFLICT DO NOTHING;
  SELECT * INTO credit FROM public.ledger_entries WHERE payment_id=attempt.id AND kind='credit';
  IF credit.id IS NULL THEN RAISE EXCEPTION 'Payment posting conflict'; END IF;
  delta:=p_refunded-attempt.refunded_minor;
  IF delta>0 THEN
   INSERT INTO public.ledger_entries(branch_id,member_id,recorded_by,operation_id,fingerprint,kind,amount_minor,currency,fund,method,reference,payment_id,reversal_of,reason,given_at)
    VALUES(attempt.branch_id,attempt.member_id,attempt.actor_id,gen_random_uuid(),'provider-refund','refund',-delta,attempt.currency,attempt.fund,'hubtel','refund-'||p_event,attempt.id,credit.id,'Verified provider refund',now());
  END IF;
  UPDATE public.payment_attempts SET status=CASE WHEN greatest(refunded_minor,p_refunded)>=amount_minor THEN 'refunded' ELSE 'paid' END,refunded_minor=greatest(refunded_minor,p_refunded),verified_at=now(),provider_transaction_id=p_transaction,updated_at=now() WHERE id=attempt.id;
 ELSE
  UPDATE public.payment_attempts SET status=CASE WHEN status IN ('paid','refunded') THEN status ELSE CASE WHEN p_state='failed' THEN 'failed' ELSE status END END,verified_at=now(),updated_at=now() WHERE id=attempt.id;
 END IF;
 INSERT INTO identity.payment_events(event_hash,reference) VALUES(p_event,p_reference) ON CONFLICT DO NOTHING;
 INSERT INTO identity.audit_events(user_id,branch_id,action,entity_id) VALUES(attempt.actor_id,attempt.branch_id,'verified_payment_'||p_state,attempt.id);
 RETURN attempt.id;
END $$;
REVOKE ALL ON FUNCTION identity.post_verified_payment(text,text,bigint,text,text,timestamptz,bigint,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION identity.post_verified_payment(text,text,bigint,text,text,timestamptz,bigint,text) TO fgc_auth;
CREATE FUNCTION identity.save_checkout(p_id uuid,p_url text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,identity,public AS $$ BEGIN
 UPDATE public.payment_attempts SET checkout_url=p_url,updated_at=now() WHERE id=p_id AND status='pending';
END $$;
REVOKE ALL ON FUNCTION identity.save_checkout(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION identity.save_checkout(uuid,text) TO fgc_auth;
GRANT SELECT ON public.payment_attempts TO fgc_auth;
CREATE POLICY payment_process_read ON public.payment_attempts FOR SELECT TO fgc_auth USING(true);
CREATE FUNCTION identity.lock_payment(p_reference text) RETURNS SETOF public.payment_attempts LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,identity,public AS $$ SELECT * FROM public.payment_attempts WHERE reference=p_reference FOR UPDATE $$;
REVOKE ALL ON FUNCTION identity.lock_payment(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION identity.lock_payment(text) TO fgc_auth;

-- Recording a refund already confirmed in Hubtel's portal does not initiate a transfer.
CREATE UNIQUE INDEX ledger_hubtel_reference ON public.ledger_entries(branch_id,reference) WHERE method='hubtel';
CREATE FUNCTION identity.record_confirmed_refund(p_id uuid,p_operation uuid,p_fingerprint text,p_amount bigint,p_reference text,p_reason text,p_document uuid) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,identity,public AS $$
DECLARE original public.ledger_entries; posted uuid; total bigint; BEGIN
 IF NOT identity.has_capability('finance') THEN RAISE EXCEPTION 'Access denied'; END IF;
 SELECT * INTO original FROM public.ledger_entries WHERE id=p_id AND branch_id=identity.branch() AND kind='credit' AND payment_id IS NOT NULL;
 IF original.id IS NULL OR p_amount IS NULL OR p_amount<=0 OR p_amount>original.amount_minor OR p_reference IS NULL OR length(p_reference) NOT BETWEEN 1 AND 160 OR p_reason IS NULL OR length(p_reason) NOT BETWEEN 1 AND 300 THEN RAISE EXCEPTION 'Invalid refund confirmation'; END IF;
 PERFORM 1 FROM public.payment_attempts WHERE id=original.payment_id FOR UPDATE;
 PERFORM 1 FROM public.ledger_entries WHERE id=original.id FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM public.documents d JOIN public.document_versions v ON v.document_id=d.id WHERE d.id=p_document AND d.branch_id=original.branch_id AND d.archived_at IS NULL AND (d.owner_id=identity.actor() OR NOT d.confidential)) THEN RAISE EXCEPTION 'Refund evidence unavailable'; END IF;
 INSERT INTO public.ledger_entries(branch_id,member_id,recorded_by,operation_id,fingerprint,kind,amount_minor,currency,fund,method,reference,payment_id,reversal_of,reason,given_at)
 VALUES(original.branch_id,original.member_id,identity.actor(),p_operation,p_fingerprint,'refund',-p_amount,original.currency,original.fund,'hubtel','portal-refund-'||p_reference,original.payment_id,original.id,'Staff-confirmed Hubtel portal refund: '||p_reason||'; evidence document '||p_document::text,now()) RETURNING id INTO posted;
 SELECT -sum(amount_minor) INTO total FROM public.ledger_entries WHERE reversal_of=original.id;
 UPDATE public.payment_attempts SET refunded_minor=total,status=CASE WHEN total=amount_minor THEN 'refunded' ELSE 'paid' END,updated_at=now() WHERE id=original.payment_id;
 RETURN posted;
END $$;
REVOKE ALL ON FUNCTION identity.record_confirmed_refund(uuid,uuid,text,bigint,text,text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION identity.record_confirmed_refund(uuid,uuid,text,bigint,text,text,uuid) TO fgc_runtime;
