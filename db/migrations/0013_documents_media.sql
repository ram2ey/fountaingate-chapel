CREATE TABLE public.stored_files (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),branch_id uuid NOT NULL REFERENCES public.branches(id),owner_id uuid NOT NULL REFERENCES identity.users(id),
 document_id uuid,version integer NOT NULL CHECK(version>0),kind text NOT NULL CHECK(kind IN ('document','audio')),
 storage_key uuid NOT NULL UNIQUE,original_name text NOT NULL CHECK(length(original_name) BETWEEN 1 AND 180),media_type text NOT NULL,
 state text NOT NULL DEFAULT 'staged' CHECK(state IN ('staged','ready','failed','purged')),byte_size bigint,digest text,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(id,branch_id),UNIQUE(document_id,version),FOREIGN KEY(document_id,branch_id) REFERENCES public.documents(id,branch_id),
 CHECK((kind='document')=(document_id IS NOT NULL)),CHECK(state<>'ready' OR (byte_size BETWEEN 1 AND 52428800 AND digest ~ '^[a-f0-9]{64}$'))
);
INSERT INTO public.stored_files(branch_id,owner_id,document_id,version,kind,storage_key,original_name,media_type,state,byte_size,digest,created_at)
 SELECT v.branch_id,d.owner_id,d.id,v.version,'document',v.storage_key::uuid,'document.pdf',v.media_type,'ready',v.byte_size,v.digest,v.created_at FROM public.document_versions v JOIN public.documents d ON d.id=v.document_id;
CREATE TABLE public.sermons(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),branch_id uuid NOT NULL REFERENCES public.branches(id),owner_id uuid NOT NULL REFERENCES identity.users(id),
 file_id uuid NOT NULL UNIQUE,title text NOT NULL CHECK(length(title) BETWEEN 1 AND 160),preacher text NOT NULL CHECK(length(preacher) BETWEEN 1 AND 120),
 preached_on date NOT NULL,published boolean NOT NULL DEFAULT false,revision integer NOT NULL DEFAULT 1,archived_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),FOREIGN KEY(file_id,branch_id) REFERENCES public.stored_files(id,branch_id)
);
CREATE TABLE public.media_settings(
 branch_id uuid PRIMARY KEY REFERENCES public.branches(id),live boolean NOT NULL DEFAULT false,live_url text,revision integer NOT NULL DEFAULT 1,
 schedules jsonb NOT NULL DEFAULT '[]',updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(NOT live OR live_url IS NOT NULL),CHECK(jsonb_typeof(schedules)='array' AND jsonb_array_length(schedules)<=12)
);
ALTER TABLE public.documents ADD COLUMN revision integer NOT NULL DEFAULT 1;
GRANT UPDATE(revision) ON public.documents TO fgc_runtime;
DO $$ DECLARE t text;BEGIN FOREACH t IN ARRAY ARRAY['stored_files','sermons','media_settings'] LOOP
 EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY',t);
 EXECUTE format('CREATE POLICY owner_maintenance ON public.%I TO %I USING(true) WITH CHECK(true)',t,current_user);
END LOOP;END $$;
CREATE POLICY files_read ON public.stored_files FOR SELECT TO fgc_runtime USING(branch_id=identity.branch() AND
 ((kind='document' AND EXISTS(SELECT 1 FROM public.documents d WHERE d.id=document_id AND d.archived_at IS NULL)) OR
 (kind='audio' AND (owner_id=identity.actor() AND identity.has_capability('documents') OR state='ready' AND EXISTS(SELECT 1 FROM public.sermons s WHERE s.file_id=stored_files.id AND s.published AND s.archived_at IS NULL)))));
CREATE POLICY files_insert ON public.stored_files FOR INSERT TO fgc_runtime WITH CHECK(branch_id=identity.branch() AND owner_id=identity.actor() AND identity.has_capability('documents') AND state='staged' AND
 (kind='audio' OR EXISTS(SELECT 1 FROM public.documents d WHERE d.id=document_id AND d.owner_id=identity.actor() AND d.archived_at IS NULL)));
CREATE POLICY files_update ON public.stored_files FOR UPDATE TO fgc_runtime USING(branch_id=identity.branch() AND owner_id=identity.actor() AND identity.has_capability('documents')) WITH CHECK(branch_id=identity.branch() AND owner_id=identity.actor() AND identity.has_capability('documents'));
CREATE POLICY sermons_read ON public.sermons FOR SELECT TO fgc_runtime USING(branch_id=identity.branch() AND archived_at IS NULL AND (published OR owner_id=identity.actor() AND identity.has_capability('documents')));
CREATE POLICY sermons_insert ON public.sermons FOR INSERT TO fgc_runtime WITH CHECK(branch_id=identity.branch() AND owner_id=identity.actor() AND identity.has_capability('documents') AND EXISTS(SELECT 1 FROM public.stored_files f WHERE f.id=file_id AND f.kind='audio' AND f.state='ready' AND f.owner_id=identity.actor()));
CREATE POLICY sermons_update ON public.sermons FOR UPDATE TO fgc_runtime USING(branch_id=identity.branch() AND owner_id=identity.actor() AND identity.has_capability('documents')) WITH CHECK(branch_id=identity.branch() AND owner_id=identity.actor() AND identity.has_capability('documents'));
CREATE POLICY settings_read ON public.media_settings FOR SELECT TO fgc_runtime USING(branch_id=identity.branch());
CREATE POLICY settings_insert ON public.media_settings FOR INSERT TO fgc_runtime WITH CHECK(branch_id=identity.branch() AND identity.has_capability('documents'));
CREATE POLICY settings_update ON public.media_settings FOR UPDATE TO fgc_runtime USING(branch_id=identity.branch() AND identity.has_capability('documents')) WITH CHECK(branch_id=identity.branch() AND identity.has_capability('documents'));
GRANT SELECT,INSERT ON public.stored_files,public.sermons,public.media_settings TO fgc_runtime;
GRANT UPDATE(state,byte_size,digest,updated_at) ON public.stored_files TO fgc_runtime;
GRANT UPDATE(title,preacher,preached_on,published,revision,archived_at,updated_at) ON public.sermons TO fgc_runtime;
GRANT UPDATE(live,live_url,schedules,revision,updated_at) ON public.media_settings TO fgc_runtime;
CREATE INDEX stored_files_cleanup_idx ON public.stored_files(state,created_at);
CREATE INDEX sermon_branch_idx ON public.sermons(branch_id,preached_on DESC,id) WHERE archived_at IS NULL;
CREATE FUNCTION identity.upload_allowed() RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,identity,public AS $$
DECLARE active_count integer;recent_count integer;BEGIN
 IF NOT identity.has_capability('documents') THEN RAISE EXCEPTION 'Access denied';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(identity.actor()::text,713));
 SELECT count(*) FILTER(WHERE state='staged' AND created_at>now()-interval '10 minutes'),count(*) FILTER(WHERE created_at>now()-interval '1 hour') INTO active_count,recent_count FROM public.stored_files WHERE owner_id=identity.actor();
 RETURN active_count<3 AND recent_count<30;
END $$;
REVOKE ALL ON FUNCTION identity.upload_allowed() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION identity.upload_allowed() TO fgc_runtime;
