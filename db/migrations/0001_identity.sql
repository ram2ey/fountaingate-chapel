CREATE SCHEMA identity;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA identity FROM PUBLIC;

CREATE TABLE public.branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL CHECK (length(name) BETWEEN 1 AND 160),
  registration_enabled boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), archived_at timestamptz
);
CREATE TABLE identity.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), phone text NOT NULL UNIQUE CHECK (phone ~ '^\+[1-9][0-9]{7,14}$'),
  email text UNIQUE, password_hash text NOT NULL, phone_verified_at timestamptz,
  disabled_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES identity.users(id), full_name text NOT NULL CHECK (length(full_name) BETWEEN 1 AND 160),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), archived_at timestamptz
);
CREATE TABLE identity.memberships (
  user_id uuid NOT NULL REFERENCES identity.users(id), branch_id uuid NOT NULL REFERENCES public.branches(id),
  role text NOT NULL CHECK (role IN ('member','pastor','admin')), created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id, branch_id)
);
CREATE TABLE identity.sessions (
  token_hash text PRIMARY KEY CHECK (length(token_hash)=64), user_id uuid NOT NULL REFERENCES identity.users(id),
  branch_id uuid NOT NULL REFERENCES public.branches(id), created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL, revoked_at timestamptz, mfa_verified_at timestamptz
);
CREATE INDEX sessions_user_idx ON identity.sessions(user_id);
CREATE TABLE identity.tokens (
  token_hash text PRIMARY KEY, user_id uuid REFERENCES identity.users(id), phone text,
  purpose text NOT NULL CHECK (purpose IN ('verify_phone','reset_password','staff_invite','kiosk_lookup')),
  branch_id uuid REFERENCES public.branches(id), invited_role text CHECK (invited_role IN ('member','pastor','admin')),
  expires_at timestamptz NOT NULL, consumed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE identity.rate_limits (
  key_hash text PRIMARY KEY, window_start timestamptz NOT NULL, attempts integer NOT NULL CHECK(attempts>0)
);
CREATE TABLE identity.kiosk_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), branch_id uuid NOT NULL REFERENCES public.branches(id),
  token_hash text NOT NULL UNIQUE, name text NOT NULL, expires_at timestamptz NOT NULL, revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Resolve identity from an opaque session, never from a browser-supplied actor ID.
CREATE FUNCTION identity.actor() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, identity AS $$
  SELECT s.user_id FROM identity.sessions s JOIN identity.users u ON u.id=s.user_id
  JOIN identity.memberships m ON m.user_id=s.user_id AND m.branch_id=s.branch_id
  JOIN public.branches b ON b.id=s.branch_id
  JOIN public.profiles p ON p.id=u.id
  WHERE s.token_hash=encode(sha256(convert_to(current_setting('fgc.session_token',true),'UTF8')),'hex')
  AND s.revoked_at IS NULL AND s.expires_at>now() AND u.disabled_at IS NULL AND u.phone_verified_at IS NOT NULL
  AND b.archived_at IS NULL AND p.archived_at IS NULL
  AND (m.role='member' OR s.mfa_verified_at IS NOT NULL)
$$;
CREATE FUNCTION identity.branch() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, identity AS $$
  SELECT branch_id FROM identity.sessions WHERE user_id=identity.actor()
  AND token_hash=encode(sha256(convert_to(current_setting('fgc.session_token',true),'UTF8')),'hex')
$$;
CREATE FUNCTION identity.has_capability(capability text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, identity AS $$
 SELECT EXISTS(SELECT 1 FROM identity.memberships m WHERE m.user_id=identity.actor() AND m.branch_id=identity.branch()
 AND (capability='self' OR (m.role IN ('pastor','admin') AND capability IN ('directory','attendance','care','prayer_moderate','documents','kiosk'))
 OR (m.role='pastor' AND capability='confidential_care') OR (m.role='admin' AND capability IN ('finance','staff'))))
$$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA identity FROM PUBLIC;
GRANT USAGE ON SCHEMA public,identity TO fgc_runtime;
GRANT EXECUTE ON FUNCTION identity.actor(),identity.branch(),identity.has_capability(text) TO fgc_runtime;
GRANT USAGE ON SCHEMA public,identity TO fgc_auth;
GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA identity TO fgc_auth;
GRANT SELECT ON public.branches TO fgc_auth;
GRANT SELECT ON public.profiles TO fgc_auth;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
CREATE POLICY profiles_self ON public.profiles FOR SELECT TO fgc_runtime USING (id=identity.actor());
CREATE POLICY profiles_update ON public.profiles FOR UPDATE TO fgc_runtime USING (id=identity.actor()) WITH CHECK (id=identity.actor());
GRANT SELECT ON public.profiles TO fgc_runtime;
GRANT UPDATE(full_name,updated_at) ON public.profiles TO fgc_runtime;
GRANT SELECT ON public.branches TO fgc_runtime;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches FORCE ROW LEVEL SECURITY;
CREATE POLICY branches_current ON public.branches FOR SELECT TO fgc_runtime USING (id=identity.branch() AND archived_at IS NULL);
