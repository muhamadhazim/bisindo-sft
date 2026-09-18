begin;
select plan(10);

select ok((select relrowsecurity from pg_class where oid = 'public.profiles'::regclass), 'profiles has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.user_progress'::regclass), 'user_progress has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.sign_mastery'::regclass), 'sign_mastery has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.user_stats'::regclass), 'user_stats has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.practice_sessions'::regclass), 'practice_sessions has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.user_achievements'::regclass), 'user_achievements has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.name_challenge_completions'::regclass), 'name challenge records have RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.certificates'::regclass), 'certificates have RLS');
select ok(not has_table_privilege('anon', 'public.certificates', 'select'), 'anon cannot read certificates directly');
select ok(has_function_privilege('authenticated', 'public.record_practice_session(uuid,text,text[],integer,text)', 'execute'), 'authenticated can record aggregate practice receipts');

select * from finish();
rollback;
