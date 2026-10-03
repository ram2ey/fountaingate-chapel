CREATE TABLE public.households (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), branch_id uuid NOT NULL REFERENCES public.branches(id), name text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), archived_at timestamptz, UNIQUE(id,branch_id)
);
CREATE TABLE public.members (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), branch_id uuid NOT NULL REFERENCES public.branches(id), profile_id uuid UNIQUE REFERENCES public.profiles(id),
 household_id uuid, first_name text NOT NULL, last_name text NOT NULL, phone text, email text, dob date, address text,
 cell_group text, status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','at_risk','first_time_guest','inactive','transferred')),
 tags text[] NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), archived_at timestamptz,
 UNIQUE(id,branch_id), FOREIGN KEY(household_id,branch_id) REFERENCES public.households(id,branch_id)
);
CREATE INDEX members_branch_idx ON public.members(branch_id,created_at,id);
CREATE TABLE public.services (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), branch_id uuid NOT NULL REFERENCES public.branches(id), name text NOT NULL,
 starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL, completed_at timestamptz, attendance_eligible boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(), archived_at timestamptz, CHECK(ends_at>starts_at), UNIQUE(id,branch_id)
);
CREATE TABLE public.attendance (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), branch_id uuid NOT NULL REFERENCES public.branches(id), service_id uuid NOT NULL,
 member_id uuid NOT NULL, recorded_by uuid REFERENCES identity.users(id), excused boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(service_id,member_id),
 FOREIGN KEY(service_id,branch_id) REFERENCES public.services(id,branch_id), FOREIGN KEY(member_id,branch_id) REFERENCES public.members(id,branch_id)
);
CREATE TABLE public.care_notes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), branch_id uuid NOT NULL REFERENCES public.branches(id), member_id uuid NOT NULL,
 author_id uuid NOT NULL REFERENCES identity.users(id), body text NOT NULL CHECK(length(body) BETWEEN 1 AND 20000),
 confidential boolean NOT NULL DEFAULT true, follow_up_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), archived_at timestamptz,
 FOREIGN KEY(member_id,branch_id) REFERENCES public.members(id,branch_id)
);
CREATE TABLE public.prayers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), branch_id uuid NOT NULL REFERENCES public.branches(id), author_id uuid NOT NULL REFERENCES identity.users(id),
 title text NOT NULL, body text NOT NULL, visibility text NOT NULL DEFAULT 'private' CHECK(visibility IN ('private','branch')),
 status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','answered','archived')), created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(), archived_at timestamptz, UNIQUE(id,branch_id)
);
CREATE TABLE public.prayer_comments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), branch_id uuid NOT NULL REFERENCES public.branches(id), prayer_id uuid NOT NULL,
 author_id uuid NOT NULL REFERENCES identity.users(id), body text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), archived_at timestamptz,
 FOREIGN KEY(prayer_id,branch_id) REFERENCES public.prayers(id,branch_id)
);
CREATE TABLE public.prayer_updates (LIKE public.prayer_comments INCLUDING DEFAULTS INCLUDING CONSTRAINTS);
ALTER TABLE public.prayer_updates ADD PRIMARY KEY(id), ADD FOREIGN KEY(branch_id) REFERENCES public.branches(id),
 ADD FOREIGN KEY(author_id) REFERENCES identity.users(id), ADD FOREIGN KEY(prayer_id,branch_id) REFERENCES public.prayers(id,branch_id);
CREATE TABLE public.prayer_reactions (
 branch_id uuid NOT NULL REFERENCES public.branches(id), prayer_id uuid NOT NULL, user_id uuid NOT NULL REFERENCES identity.users(id),
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(prayer_id,user_id), FOREIGN KEY(prayer_id,branch_id) REFERENCES public.prayers(id,branch_id)
);
CREATE TABLE public.guest_followups (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), branch_id uuid NOT NULL REFERENCES public.branches(id), member_id uuid NOT NULL,
 stage text NOT NULL DEFAULT 'new' CHECK(stage IN ('new','welcomed','contacted','invited','completed')), assigned_to uuid REFERENCES identity.users(id),
 consent_to_contact boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), archived_at timestamptz,
 FOREIGN KEY(member_id,branch_id) REFERENCES public.members(id,branch_id), UNIQUE(member_id)
);
CREATE TABLE public.followup_tasks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), branch_id uuid NOT NULL REFERENCES public.branches(id), member_id uuid NOT NULL,
 assigned_to uuid REFERENCES identity.users(id), due_at timestamptz NOT NULL, completed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(member_id,branch_id) REFERENCES public.members(id,branch_id)
);
CREATE TABLE public.documents (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), branch_id uuid NOT NULL REFERENCES public.branches(id), owner_id uuid NOT NULL REFERENCES identity.users(id),
 title text NOT NULL, confidential boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 archived_at timestamptz, UNIQUE(id,branch_id)
);
CREATE TABLE public.document_versions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), branch_id uuid NOT NULL REFERENCES public.branches(id), document_id uuid NOT NULL,
 version integer NOT NULL CHECK(version>0), storage_key text NOT NULL UNIQUE CHECK(storage_key ~ '^[a-f0-9-]{36}$'),
 media_type text NOT NULL, byte_size bigint NOT NULL CHECK(byte_size>0 AND byte_size<=52428800), digest text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(document_id,version), FOREIGN KEY(document_id,branch_id) REFERENCES public.documents(id,branch_id)
);
CREATE TABLE public.notification_preferences (
 user_id uuid PRIMARY KEY REFERENCES identity.users(id), sms boolean NOT NULL DEFAULT false, email boolean NOT NULL DEFAULT false,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.audit_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), branch_id uuid NOT NULL REFERENCES public.branches(id), actor_id uuid NOT NULL REFERENCES identity.users(id),
 action text NOT NULL, entity_type text NOT NULL, entity_id uuid, created_at timestamptz NOT NULL DEFAULT now()
);

-- All branch records deny absent context; identities and branches are immutable to runtime UPDATE.
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['households','members','services','attendance','care_notes','prayers','prayer_comments','prayer_updates','prayer_reactions','guest_followups','followup_tasks','documents','document_versions','notification_preferences','audit_events'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY',t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['households','members','services','attendance','guest_followups','followup_tasks'] LOOP
  EXECUTE format('CREATE POLICY staff_read ON public.%I FOR SELECT TO fgc_runtime USING(branch_id=identity.branch() AND identity.has_capability(''directory''))',t);
  EXECUTE format('CREATE POLICY staff_insert ON public.%I FOR INSERT TO fgc_runtime WITH CHECK(branch_id=identity.branch() AND identity.has_capability(''directory''))',t);
  EXECUTE format('CREATE POLICY staff_update ON public.%I FOR UPDATE TO fgc_runtime USING(branch_id=identity.branch() AND identity.has_capability(''directory'')) WITH CHECK(branch_id=identity.branch() AND identity.has_capability(''directory''))',t);
 END LOOP;
END $$;
CREATE POLICY member_self ON public.members FOR SELECT TO fgc_runtime USING(branch_id=identity.branch() AND profile_id=identity.actor());
CREATE POLICY attendance_self ON public.attendance FOR SELECT TO fgc_runtime USING(branch_id=identity.branch() AND EXISTS(SELECT 1 FROM public.members m WHERE m.id=member_id AND m.profile_id=identity.actor()));
CREATE POLICY care_read ON public.care_notes FOR SELECT TO fgc_runtime USING(branch_id=identity.branch() AND identity.has_capability(CASE WHEN confidential THEN 'confidential_care' ELSE 'care' END));
CREATE POLICY care_insert ON public.care_notes FOR INSERT TO fgc_runtime WITH CHECK(branch_id=identity.branch() AND author_id=identity.actor() AND identity.has_capability(CASE WHEN confidential THEN 'confidential_care' ELSE 'care' END));
CREATE POLICY care_update ON public.care_notes FOR UPDATE TO fgc_runtime USING(branch_id=identity.branch() AND author_id=identity.actor() AND identity.has_capability(CASE WHEN confidential THEN 'confidential_care' ELSE 'care' END)) WITH CHECK(branch_id=identity.branch() AND author_id=identity.actor() AND identity.has_capability(CASE WHEN confidential THEN 'confidential_care' ELSE 'care' END));
CREATE POLICY prayer_read ON public.prayers FOR SELECT TO fgc_runtime USING(branch_id=identity.branch() AND (author_id=identity.actor() OR visibility='branch' OR identity.has_capability('prayer_moderate')));
CREATE POLICY prayer_insert ON public.prayers FOR INSERT TO fgc_runtime WITH CHECK(branch_id=identity.branch() AND author_id=identity.actor());
CREATE POLICY prayer_update ON public.prayers FOR UPDATE TO fgc_runtime USING(branch_id=identity.branch() AND (author_id=identity.actor() OR identity.has_capability('prayer_moderate'))) WITH CHECK(branch_id=identity.branch() AND (author_id=identity.actor() OR identity.has_capability('prayer_moderate')));
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['prayer_comments','prayer_updates','prayer_reactions'] LOOP
  EXECUTE format('CREATE POLICY prayer_child_read ON public.%I FOR SELECT TO fgc_runtime USING(branch_id=identity.branch() AND EXISTS(SELECT 1 FROM public.prayers p WHERE p.id=prayer_id))',t);
  IF t='prayer_reactions' THEN
   EXECUTE format('CREATE POLICY prayer_child_insert ON public.%I FOR INSERT TO fgc_runtime WITH CHECK(branch_id=identity.branch() AND user_id=identity.actor() AND EXISTS(SELECT 1 FROM public.prayers p WHERE p.id=prayer_id))',t);
   EXECUTE format('CREATE POLICY reaction_delete ON public.%I FOR DELETE TO fgc_runtime USING(user_id=identity.actor() AND branch_id=identity.branch())',t);
  ELSE
   EXECUTE format('CREATE POLICY prayer_child_insert ON public.%I FOR INSERT TO fgc_runtime WITH CHECK(branch_id=identity.branch() AND author_id=identity.actor() AND EXISTS(SELECT 1 FROM public.prayers p WHERE p.id=prayer_id AND (p.author_id=identity.actor() OR identity.has_capability(''prayer_moderate'') OR %L=''prayer_comments'')))',t,t);
  END IF;
 END LOOP;
END $$;
CREATE POLICY documents_read ON public.documents FOR SELECT TO fgc_runtime USING(branch_id=identity.branch() AND identity.has_capability('documents') AND (NOT confidential OR owner_id=identity.actor() OR identity.has_capability('confidential_care')));
CREATE POLICY documents_insert ON public.documents FOR INSERT TO fgc_runtime WITH CHECK(branch_id=identity.branch() AND owner_id=identity.actor() AND identity.has_capability('documents'));
CREATE POLICY documents_update ON public.documents FOR UPDATE TO fgc_runtime USING(branch_id=identity.branch() AND owner_id=identity.actor() AND identity.has_capability('documents')) WITH CHECK(branch_id=identity.branch() AND owner_id=identity.actor() AND identity.has_capability('documents'));
CREATE POLICY versions_read ON public.document_versions FOR SELECT TO fgc_runtime USING(branch_id=identity.branch() AND EXISTS(SELECT 1 FROM public.documents d WHERE d.id=document_id));
CREATE POLICY versions_insert ON public.document_versions FOR INSERT TO fgc_runtime WITH CHECK(branch_id=identity.branch() AND EXISTS(SELECT 1 FROM public.documents d WHERE d.id=document_id AND d.owner_id=identity.actor()));
CREATE POLICY preferences_self ON public.notification_preferences TO fgc_runtime USING(user_id=identity.actor()) WITH CHECK(user_id=identity.actor());
CREATE POLICY audit_read ON public.audit_events FOR SELECT TO fgc_runtime USING(branch_id=identity.branch() AND identity.has_capability('staff'));
CREATE POLICY audit_insert ON public.audit_events FOR INSERT TO fgc_runtime WITH CHECK(branch_id=identity.branch() AND actor_id=identity.actor());
GRANT SELECT,INSERT ON public.households,public.members,public.services,public.attendance,public.care_notes,public.prayers,public.prayer_comments,public.prayer_updates,public.prayer_reactions,public.guest_followups,public.followup_tasks,public.documents,public.document_versions,public.notification_preferences,public.audit_events TO fgc_runtime;
REVOKE INSERT ON public.branches,public.profiles FROM fgc_runtime;
GRANT UPDATE(name,updated_at,archived_at) ON public.households TO fgc_runtime;
GRANT UPDATE(first_name,last_name,phone,email,dob,address,cell_group,status,tags,updated_at,archived_at) ON public.members TO fgc_runtime;
GRANT UPDATE(name,starts_at,ends_at,completed_at,attendance_eligible,archived_at) ON public.services TO fgc_runtime;
GRANT UPDATE(excused) ON public.attendance TO fgc_runtime;
GRANT UPDATE(body,follow_up_at,archived_at) ON public.care_notes TO fgc_runtime;
GRANT UPDATE(title,body,visibility,status,updated_at,archived_at) ON public.prayers TO fgc_runtime;
GRANT UPDATE(stage,assigned_to,consent_to_contact,updated_at,archived_at) ON public.guest_followups TO fgc_runtime;
GRANT UPDATE(assigned_to,due_at,completed_at) ON public.followup_tasks TO fgc_runtime;
GRANT UPDATE(title,updated_at,archived_at) ON public.documents TO fgc_runtime;
GRANT UPDATE(sms,email,updated_at) ON public.notification_preferences TO fgc_runtime;
GRANT DELETE ON public.prayer_reactions TO fgc_runtime;
-- No runtime DELETE on retained records, no audit UPDATE/DELETE, no ownership/branch UPDATE.
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['households','services','attendance','care_notes','prayers','prayer_comments','prayer_updates','prayer_reactions','guest_followups','followup_tasks','documents','document_versions','audit_events'] LOOP
  EXECUTE format('CREATE INDEX ON public.%I(branch_id)',t);
 END LOOP;
END $$;
