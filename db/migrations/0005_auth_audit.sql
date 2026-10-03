CREATE TABLE identity.audit_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES identity.users(id),
 branch_id uuid REFERENCES public.branches(id), action text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT ON identity.audit_events TO fgc_auth;
-- Auth events contain no passwords, tokens, phone numbers or confidential bodies.
