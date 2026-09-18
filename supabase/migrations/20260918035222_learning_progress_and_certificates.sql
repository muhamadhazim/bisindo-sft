create schema if not exists private;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Teman belajar' check (char_length(display_name) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null check (lesson_id ~ '^huruf-[a-z]$'),
  status text not null default 'AVAILABLE' check (status in ('LOCKED', 'AVAILABLE', 'IN_PROGRESS', 'COMPLETED')),
  accepted_count integer not null default 0 check (accepted_count >= 0),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);
create index user_progress_user_id_idx on public.user_progress(user_id);

create table public.sign_mastery (
  user_id uuid not null references auth.users(id) on delete cascade,
  sign_id text not null check (sign_id ~ '^huruf-[a-z]$'),
  accepted_count integer not null default 0 check (accepted_count >= 0),
  retry_count integer not null default 0 check (retry_count >= 0),
  mastery_state text not null default 'NEW' check (mastery_state in ('NEW', 'LEARNING', 'FAMILIAR', 'MASTERED')),
  last_practiced_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, sign_id)
);
create index sign_mastery_user_id_idx on public.sign_mastery(user_id);

create table public.user_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  xp bigint not null default 0 check (xp >= 0),
  current_streak integer not null default 0 check (current_streak >= 0),
  longest_streak integer not null default 0 check (longest_streak >= 0),
  last_learning_date date,
  updated_at timestamptz not null default now()
);

create table public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('UNIT_PRACTICE', 'NAME_CHALLENGE')),
  completed_sign_ids text[] not null default '{}',
  retry_count integer not null default 0 check (retry_count >= 0),
  xp_earned integer not null default 0 check (xp_earned >= 0),
  model_version text,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index practice_sessions_user_id_completed_at_idx on public.practice_sessions(user_id, completed_at desc);

create table public.user_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null,
  awarded_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create table public.name_challenge_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_count smallint not null check (target_count between 1 and 40),
  curriculum_version text not null,
  contains_snapshot_letters boolean not null default false,
  completed_at timestamptz not null default now(),
  unique (user_id, curriculum_version)
);
create index name_challenge_completions_user_id_idx on public.name_challenge_completions(user_id);

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  verification_code uuid not null unique default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipient_name text not null check (char_length(recipient_name) between 1 and 120),
  curriculum_version text not null,
  issued_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (user_id, curriculum_version)
);

alter table public.profiles enable row level security;
alter table public.user_progress enable row level security;
alter table public.sign_mastery enable row level security;
alter table public.user_stats enable row level security;
alter table public.practice_sessions enable row level security;
alter table public.user_achievements enable row level security;
alter table public.name_challenge_completions enable row level security;
alter table public.certificates enable row level security;

grant usage on schema public to anon, authenticated;
revoke all on all tables in schema public from anon, authenticated;
grant select on public.profiles, public.user_progress, public.sign_mastery, public.user_stats, public.practice_sessions, public.user_achievements, public.name_challenge_completions, public.certificates to authenticated;

create policy "users read own profiles" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "users read own progress" on public.user_progress for select to authenticated using ((select auth.uid()) = user_id);
create policy "users read own mastery" on public.sign_mastery for select to authenticated using ((select auth.uid()) = user_id);
create policy "users read own stats" on public.user_stats for select to authenticated using ((select auth.uid()) = user_id);
create policy "users read own sessions" on public.practice_sessions for select to authenticated using ((select auth.uid()) = user_id);
create policy "users read own achievements" on public.user_achievements for select to authenticated using ((select auth.uid()) = user_id);
create policy "users read own name challenges" on public.name_challenge_completions for select to authenticated using ((select auth.uid()) = user_id);
create policy "users read own certificates" on public.certificates for select to authenticated using ((select auth.uid()) = user_id);

create or replace function public.record_practice_session(
  p_receipt_id uuid,
  p_mode text,
  p_completed_sign_ids text[],
  p_retry_count integer,
  p_model_version text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_rows integer := 0;
  v_xp integer := greatest(cardinality(p_completed_sign_ids), 0) * 10;
  v_completed integer;
  v_streak integer;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_mode not in ('UNIT_PRACTICE', 'NAME_CHALLENGE') or p_retry_count < 0 then raise exception 'Invalid session summary'; end if;
  insert into public.practice_sessions (receipt_id, user_id, mode, completed_sign_ids, retry_count, xp_earned, model_version)
  values (p_receipt_id, v_user_id, p_mode, p_completed_sign_ids, p_retry_count, v_xp, p_model_version)
  on conflict (receipt_id) do nothing;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then return jsonb_build_object('recorded', false); end if;

  insert into public.profiles (id) values (v_user_id) on conflict (id) do nothing;
  insert into public.user_stats (user_id, xp, current_streak, longest_streak, last_learning_date)
  values (v_user_id, v_xp, 1, 1, current_date)
  on conflict (user_id) do update set
    xp = public.user_stats.xp + excluded.xp,
    current_streak = case when public.user_stats.last_learning_date = current_date then public.user_stats.current_streak when public.user_stats.last_learning_date = current_date - 1 then public.user_stats.current_streak + 1 else 1 end,
    longest_streak = greatest(public.user_stats.longest_streak, case when public.user_stats.last_learning_date = current_date then public.user_stats.current_streak when public.user_stats.last_learning_date = current_date - 1 then public.user_stats.current_streak + 1 else 1 end),
    last_learning_date = current_date, updated_at = now();

  insert into public.user_progress (user_id, lesson_id, status, accepted_count, completed_at)
  select v_user_id, sign_id, 'COMPLETED', 1, now() from unnest(p_completed_sign_ids) sign_id
  on conflict (user_id, lesson_id) do update set status = 'COMPLETED', accepted_count = public.user_progress.accepted_count + 1, completed_at = coalesce(public.user_progress.completed_at, now()), updated_at = now();
  insert into public.sign_mastery (user_id, sign_id, accepted_count, retry_count, mastery_state, last_practiced_at)
  select v_user_id, sign_id, 1, p_retry_count, 'LEARNING', now() from unnest(p_completed_sign_ids) sign_id
  on conflict (user_id, sign_id) do update set accepted_count = public.sign_mastery.accepted_count + 1, retry_count = public.sign_mastery.retry_count + excluded.retry_count, mastery_state = case when public.sign_mastery.accepted_count + 1 >= 5 then 'MASTERED' when public.sign_mastery.accepted_count + 1 >= 3 then 'FAMILIAR' else 'LEARNING' end, last_practiced_at = now(), updated_at = now();

  select count(*) into v_completed from public.user_progress where user_id = v_user_id and status = 'COMPLETED';
  insert into public.user_achievements (user_id, achievement_id) values (v_user_id, 'first-sign') on conflict do nothing;
  if v_completed >= 6 then insert into public.user_achievements values (v_user_id, 'level-1') on conflict do nothing; end if;
  if v_completed >= 12 then insert into public.user_achievements values (v_user_id, 'level-2') on conflict do nothing; end if;
  if v_completed >= 18 then insert into public.user_achievements values (v_user_id, 'level-3') on conflict do nothing; end if;
  if v_completed >= 26 then insert into public.user_achievements values (v_user_id, 'alphabet-explorer') on conflict do nothing; end if;
  select current_streak into v_streak from public.user_stats where user_id = v_user_id;
  if v_streak >= 3 then insert into public.user_achievements values (v_user_id, 'steady-three') on conflict do nothing; end if;
  return jsonb_build_object('recorded', true, 'xpEarned', v_xp, 'completedLessons', v_completed);
end;
$$;

create or replace function public.complete_name_challenge(p_target_count smallint, p_curriculum_version text, p_contains_snapshot_letters boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user_id uuid := auth.uid(); v_completed integer;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  select count(*) into v_completed from public.user_progress where user_id = v_user_id and status = 'COMPLETED';
  if v_completed < 26 then raise exception 'Complete the alphabet first'; end if;
  insert into public.name_challenge_completions (user_id, target_count, curriculum_version, contains_snapshot_letters) values (v_user_id, p_target_count, p_curriculum_version, p_contains_snapshot_letters) on conflict (user_id, curriculum_version) do update set target_count = excluded.target_count, completed_at = now(), contains_snapshot_letters = excluded.contains_snapshot_letters;
  insert into public.user_achievements values (v_user_id, 'name-speller') on conflict do nothing;
  return jsonb_build_object('completed', true);
end;
$$;

create or replace function public.issue_certificate(p_recipient_name text, p_curriculum_version text)
returns public.certificates language plpgsql security definer set search_path = public as $$
declare v_user_id uuid := auth.uid(); v_certificate public.certificates;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.name_challenge_completions where user_id = v_user_id and curriculum_version = p_curriculum_version) then raise exception 'Complete name challenge first'; end if;
  if (select count(*) from public.user_progress where user_id = v_user_id and status = 'COMPLETED') < 26 then raise exception 'Complete the alphabet first'; end if;
  insert into public.certificates (user_id, recipient_name, curriculum_version) values (v_user_id, trim(p_recipient_name), p_curriculum_version) on conflict (user_id, curriculum_version) do update set recipient_name = public.certificates.recipient_name returning * into v_certificate;
  return v_certificate;
end;
$$;

create or replace function public.verify_certificate(p_verification_code uuid)
returns table (recipient_name text, curriculum_version text, issued_at timestamptz, is_valid boolean)
language sql security definer set search_path = public as $$
  select c.recipient_name, c.curriculum_version, c.issued_at, c.revoked_at is null from public.certificates c where c.verification_code = p_verification_code;
$$;

revoke all on function public.record_practice_session(uuid, text, text[], integer, text) from public;
revoke all on function public.complete_name_challenge(smallint, text, boolean) from public;
revoke all on function public.issue_certificate(text, text) from public;
revoke all on function public.verify_certificate(uuid) from public;
grant execute on function public.record_practice_session(uuid, text, text[], integer, text) to authenticated;
grant execute on function public.complete_name_challenge(smallint, text, boolean) to authenticated;
grant execute on function public.issue_certificate(text, text) to authenticated;
grant execute on function public.verify_certificate(uuid) to anon, authenticated;
