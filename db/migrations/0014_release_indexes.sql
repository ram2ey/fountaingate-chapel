-- pg_trgm is trusted in PostgreSQL 17; the migration role needs database CREATE.
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;
CREATE INDEX members_name_search_idx ON public.members USING gin ((first_name||' '||last_name) gin_trgm_ops);
CREATE INDEX care_body_search_idx ON public.care_notes USING gin (body gin_trgm_ops) WHERE archived_at IS NULL;
CREATE INDEX prayer_title_search_idx ON public.prayers USING gin (title gin_trgm_ops) WHERE archived_at IS NULL;
CREATE INDEX care_page_idx ON public.care_notes(branch_id,created_at DESC,id DESC) WHERE archived_at IS NULL;
CREATE INDEX prayers_page_idx ON public.prayers(branch_id,created_at DESC,id DESC) WHERE archived_at IS NULL;
CREATE INDEX guest_followup_page_idx ON public.guest_followups(branch_id,created_at DESC,id DESC) WHERE archived_at IS NULL;
CREATE INDEX audit_page_idx ON public.audit_events(branch_id,created_at DESC,id DESC);
CREATE INDEX payment_attempt_page_idx ON public.payment_attempts(branch_id,created_at DESC,id DESC);
CREATE INDEX document_page_idx ON public.documents(branch_id,id) WHERE archived_at IS NULL;
CREATE INDEX sermon_page_idx ON public.sermons(branch_id,id) WHERE archived_at IS NULL;
CREATE INDEX stored_files_document_idx ON public.stored_files(document_id,version DESC) WHERE state='ready';
CREATE INDEX message_branch_state_idx ON public.message_deliveries(branch_id,state,next_attempt_at);
CREATE INDEX household_page_idx ON public.households(branch_id,id) WHERE archived_at IS NULL;
CREATE INDEX roster_household_idx ON public.members(branch_id,household_id,id) WHERE archived_at IS NULL;
CREATE FUNCTION identity.next_birthday(p_dob date,p_today date) RETURNS date LANGUAGE plpgsql IMMUTABLE STRICT SET search_path=pg_catalog AS $$
DECLARE y integer:=extract(year FROM p_today);m integer:=extract(month FROM p_dob);d integer:=extract(day FROM p_dob);candidate date;BEGIN
 candidate:=make_date(y,m,least(d,extract(day FROM make_date(y,m,1)+interval '1 month'-interval '1 day')::integer));
 IF candidate<p_today THEN y:=y+1;candidate:=make_date(y,m,least(d,extract(day FROM make_date(y,m,1)+interval '1 month'-interval '1 day')::integer));END IF;
 RETURN candidate;
END $$;
REVOKE ALL ON FUNCTION identity.next_birthday(date,date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION identity.next_birthday(date,date) TO fgc_runtime;

-- Session-derived values are constant within a statement. Scalar subqueries
-- become initplans, avoiding repeated identity joins for every directory row.
-- Authorization still resolves the current database session on each statement.
ALTER POLICY staff_read ON public.members USING(branch_id=(SELECT identity.branch()) AND (SELECT identity.has_capability('directory')));
ALTER POLICY member_self ON public.members USING(branch_id=(SELECT identity.branch()) AND profile_id=(SELECT identity.actor()));
ALTER POLICY care_read ON public.care_notes USING(branch_id=(SELECT identity.branch()) AND ((confidential AND (SELECT identity.has_capability('confidential_care'))) OR (NOT confidential AND (SELECT identity.has_capability('care')))) AND EXISTS(SELECT 1 FROM public.members m WHERE m.id=member_id AND m.archived_at IS NULL));
ALTER POLICY finance_read ON public.ledger_entries USING(branch_id=(SELECT identity.branch()) AND (SELECT identity.has_capability('finance')));
ALTER POLICY ledger_self ON public.ledger_entries USING(branch_id=(SELECT identity.branch()) AND EXISTS(SELECT 1 FROM public.members m WHERE m.id=member_id AND m.profile_id=(SELECT identity.actor())));
ALTER POLICY finance_read ON public.payment_attempts USING(branch_id=(SELECT identity.branch()) AND (SELECT identity.has_capability('finance')));
ALTER POLICY attempt_self ON public.payment_attempts USING(branch_id=(SELECT identity.branch()) AND actor_id=(SELECT identity.actor()));
