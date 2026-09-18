-- Keep privileged implementation functions outside the Data API schema.
-- Public functions below are SECURITY INVOKER wrappers; the internal functions
-- retain their auth.uid() checks before modifying user-owned records.
create schema if not exists app_private;
revoke all on schema app_private from public;

alter function public.record_practice_session(uuid, text, text[], integer, text)
  set schema app_private;
alter function public.complete_name_challenge(smallint, text, boolean)
  set schema app_private;
alter function public.issue_certificate(text, text)
  set schema app_private;
alter function public.verify_certificate(uuid)
  set schema app_private;

revoke all on function app_private.record_practice_session(uuid, text, text[], integer, text) from public;
revoke all on function app_private.complete_name_challenge(smallint, text, boolean) from public;
revoke all on function app_private.issue_certificate(text, text) from public;
revoke all on function app_private.verify_certificate(uuid) from public;

-- The schema is not exposed through the Data API. These grants let the
-- non-privileged public wrappers call the private implementations.
grant usage on schema app_private to anon, authenticated;
grant execute on function app_private.record_practice_session(uuid, text, text[], integer, text) to authenticated;
grant execute on function app_private.complete_name_challenge(smallint, text, boolean) to authenticated;
grant execute on function app_private.issue_certificate(text, text) to authenticated;
grant execute on function app_private.verify_certificate(uuid) to anon, authenticated;

create or replace function public.record_practice_session(
  p_receipt_id uuid,
  p_mode text,
  p_completed_sign_ids text[],
  p_retry_count integer,
  p_model_version text
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select app_private.record_practice_session($1, $2, $3, $4, $5);
$$;

create or replace function public.complete_name_challenge(
  p_target_count smallint,
  p_curriculum_version text,
  p_contains_snapshot_letters boolean
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select app_private.complete_name_challenge($1, $2, $3);
$$;

create or replace function public.issue_certificate(
  p_recipient_name text,
  p_curriculum_version text
)
returns public.certificates
language sql
security invoker
set search_path = ''
as $$
  select app_private.issue_certificate($1, $2);
$$;

create or replace function public.verify_certificate(p_verification_code uuid)
returns table (
  recipient_name text,
  curriculum_version text,
  issued_at timestamptz,
  is_valid boolean
)
language sql
security invoker
set search_path = ''
as $$
  select * from app_private.verify_certificate($1);
$$;

revoke all on function public.record_practice_session(uuid, text, text[], integer, text) from public;
revoke all on function public.complete_name_challenge(smallint, text, boolean) from public;
revoke all on function public.issue_certificate(text, text) from public;
revoke all on function public.verify_certificate(uuid) from public;
grant execute on function public.record_practice_session(uuid, text, text[], integer, text) to authenticated;
grant execute on function public.complete_name_challenge(smallint, text, boolean) to authenticated;
grant execute on function public.issue_certificate(text, text) to authenticated;
grant execute on function public.verify_certificate(uuid) to anon, authenticated;

-- The Dashboard's "automatic RLS" option installs this event-trigger helper.
-- It does not need to be callable from the Data API.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end;
$$;
