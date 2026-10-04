-- Staff sign in with their existing verified phone and password.
CREATE OR REPLACE FUNCTION identity.actor() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, identity AS $$
  SELECT s.user_id FROM identity.sessions s JOIN identity.users u ON u.id=s.user_id
  JOIN identity.memberships m ON m.user_id=s.user_id AND m.branch_id=s.branch_id
  JOIN public.branches b ON b.id=s.branch_id
  JOIN public.profiles p ON p.id=u.id
  WHERE s.token_hash=encode(sha256(convert_to(current_setting('fgc.session_token',true),'UTF8')),'hex')
  AND s.revoked_at IS NULL AND s.expires_at>now() AND u.disabled_at IS NULL AND u.phone_verified_at IS NOT NULL
  AND b.archived_at IS NULL AND p.archived_at IS NULL
$$;
