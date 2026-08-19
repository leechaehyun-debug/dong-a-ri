-- Supabase Dashboard > SQL Editor 에서 이 파일 전체를 한 번 실행하세요.

create table if not exists public.monthly_rosters (
  month_key text primary key,
  roster jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint monthly_rosters_month_key_format
    check (month_key ~ '^[0-9]{4}-(0[1-9]|1[0-2])$')
);

alter table public.monthly_rosters enable row level security;

grant select, insert, update on table public.monthly_rosters to anon, authenticated;

-- 현재 앱은 "링크를 받은 교직원이 함께 사용하는" 간단한 형태입니다.
-- 로그인 기능을 아직 넣지 않았으므로 익명 사용자도 읽고 저장할 수 있게 합니다.
drop policy if exists "monthly_rosters_public_read" on public.monthly_rosters;
create policy "monthly_rosters_public_read"
on public.monthly_rosters
for select
to anon, authenticated
using (true);

drop policy if exists "monthly_rosters_public_insert" on public.monthly_rosters;
create policy "monthly_rosters_public_insert"
on public.monthly_rosters
for insert
to anon, authenticated
with check (true);

drop policy if exists "monthly_rosters_public_update" on public.monthly_rosters;
create policy "monthly_rosters_public_update"
on public.monthly_rosters
for update
to anon, authenticated
using (true)
with check (true);
