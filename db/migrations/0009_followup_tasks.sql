ALTER TABLE public.followup_tasks ADD COLUMN stage text NOT NULL DEFAULT 'new';
CREATE UNIQUE INDEX followup_stage_unique ON public.followup_tasks(member_id,stage);
CREATE FUNCTION identity.assignable_user(uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path=pg_catalog,identity AS $$
 SELECT EXISTS(SELECT 1 FROM identity.memberships m JOIN identity.users u ON u.id=m.user_id
 WHERE m.user_id=uid AND m.branch_id=identity.branch() AND m.role IN ('pastor','admin') AND u.disabled_at IS NULL AND u.phone_verified_at IS NOT NULL)
$$;
REVOKE ALL ON FUNCTION identity.assignable_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION identity.assignable_user(uuid) TO fgc_runtime;
