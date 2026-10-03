ALTER TABLE public.prayers ADD CHECK(length(title) BETWEEN 1 AND 160), ADD CHECK(length(body) BETWEEN 1 AND 20000);
ALTER TABLE public.prayer_comments ADD CHECK(length(body) BETWEEN 1 AND 10000);
ALTER TABLE public.prayer_updates ADD CHECK(length(body) BETWEEN 1 AND 10000);
ALTER TABLE public.attendance ALTER COLUMN recorded_by SET DEFAULT identity.actor();
DROP POLICY staff_insert ON public.attendance;
CREATE POLICY attendance_insert ON public.attendance FOR INSERT TO fgc_runtime WITH CHECK(branch_id=identity.branch() AND recorded_by=identity.actor() AND identity.has_capability('attendance'));
REVOKE INSERT ON public.members FROM fgc_runtime;
GRANT INSERT(branch_id,household_id,first_name,last_name,phone,email,dob,address,cell_group,status,tags) ON public.members TO fgc_runtime;
ALTER TABLE public.guest_followups ADD FOREIGN KEY(assigned_to,branch_id) REFERENCES identity.memberships(user_id,branch_id);
ALTER TABLE public.followup_tasks ADD FOREIGN KEY(assigned_to,branch_id) REFERENCES identity.memberships(user_id,branch_id);

CREATE TABLE public.contributions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), branch_id uuid NOT NULL REFERENCES public.branches(id), member_id uuid,
 amount_minor bigint NOT NULL CHECK(amount_minor>0), currency text NOT NULL CHECK(currency ~ '^[A-Z]{3}$'),
 fund text NOT NULL, method text NOT NULL, reference text, recorded_by uuid NOT NULL REFERENCES identity.users(id),
 given_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now(), archived_at timestamptz,
 FOREIGN KEY(member_id,branch_id) REFERENCES public.members(id,branch_id)
);
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions FORCE ROW LEVEL SECURITY;
CREATE INDEX contributions_branch_idx ON public.contributions(branch_id,given_at,id);
CREATE POLICY finance_read ON public.contributions FOR SELECT TO fgc_runtime USING(branch_id=identity.branch() AND identity.has_capability('finance'));
CREATE POLICY giving_self ON public.contributions FOR SELECT TO fgc_runtime USING(branch_id=identity.branch() AND EXISTS(SELECT 1 FROM public.members m WHERE m.id=member_id AND m.profile_id=identity.actor()));
CREATE POLICY finance_insert ON public.contributions FOR INSERT TO fgc_runtime WITH CHECK(branch_id=identity.branch() AND recorded_by=identity.actor() AND identity.has_capability('finance'));
DO $$ BEGIN EXECUTE format('CREATE POLICY owner_maintenance ON public.contributions TO %I USING(true) WITH CHECK(true)',current_user); END $$;
GRANT SELECT,INSERT ON public.contributions TO fgc_runtime;
