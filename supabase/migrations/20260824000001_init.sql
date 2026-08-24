-- =========================================================
-- 디자인사 15주 학습 앱 — Phase 1 스키마
-- =========================================================

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  student_no text unique not null,
  name text not null,
  nickname text not null,
  section smallint not null check (section in (1,2,3)),
  role text not null default 'student' check (role in ('student','professor')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.is_professor()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'professor'
  );
$$;

create policy "profiles: self read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: professor reads all"
  on public.profiles for select
  using (public.is_professor());

create policy "profiles: self update"
  on public.profiles for update
  using (auth.uid() = id);

-- 가입 시 auth.users -> profiles 자동 생성
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, student_no, name, nickname, section)
  values (
    new.id,
    new.raw_user_meta_data->>'student_no',
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'nickname',
    (new.raw_user_meta_data->>'section')::smallint
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- weeks ----------
create table public.weeks (
  id smallint primary key check (id between 1 and 15),
  short_title text not null,
  full_title text not null,
  key_question text,
  is_exam boolean not null default false,
  is_open boolean not null default false,
  activity_order text[] not null default array['quiz','balance','think','make']
);

alter table public.weeks enable row level security;

create policy "weeks: read all authenticated"
  on public.weeks for select
  using (auth.role() = 'authenticated');

create policy "weeks: professor writes"
  on public.weeks for all
  using (public.is_professor())
  with check (public.is_professor());

insert into public.weeks (id, short_title, full_title, key_question, is_exam) values
  (1,  '오리엔테이션',      '오리엔테이션',                  '디자인이란 무엇인가?', false),
  (2,  '기원과 장인정신',    '디자인의 초기 기원과 장인정신',  '어디까지가 디자인인가?', false),
  (3,  '산업혁명',          '이성의 시대와 산업혁명',         '디자인은 언제부터 미술과 분리되었는가?', false),
  (4,  '만국박람회',        '합리화된 생산과 만국박람회',     '기계 생산은 시각문화를 어떻게 변화시켰는가?', false),
  (5,  '미술공예운동',      '개혁의 바람: 미술공예운동',      '좋은 디자인이란 무엇인가?', false),
  (6,  '아르누보',          '아르누보',                       '장식은 디자인의 본질인가?', false),
  (7,  '이론에서 실천으로', '이론에서 실천으로',              '이론은 어떻게 실천이 되는가?', false),
  (8,  '중간고사',          '중간고사',                       null, true),
  (9,  '포디즘',            '미국식 시스템과 포디즘',         '디자인이 소비를 만드는가, 소비가 디자인을 만드는가?', false),
  (10, '모더니즘',          '환원주의와 모더니즘',            '형태는 의미를 대체할 수 있는가?', false),
  (11, '아르데코',          '아르데코와 모던 스타일',         '양식은 어떻게 대중의 욕망이 되는가?', false),
  (12, '굿 디자인',         '전쟁·전후 디자인과 굿 디자인',   '좋은 디자인은 무엇으로 정의되는가?', false),
  (13, '한국 근현대 디자인', '한국 근현대 디자인사',          '한국 디자인은 근대를 어떻게 구성했는가?', false),
  (14, '디지털과 AI',       '디지털 전환에서 AI까지',         'AI 시대, 디자이너의 역할은 무엇인가?', false),
  (15, '기말시험',          '기말시험',                       null, true);

-- 1주차만 기본으로 열어둠
update public.weeks set is_open = true where id = 1;

-- ---------- completions ----------
create table public.completions (
  user_id uuid not null references public.profiles(id) on delete cascade,
  week_id smallint not null references public.weeks(id) on delete cascade,
  activity text not null check (activity in ('quiz','balance','think','make')),
  completed_at timestamptz not null default now(),
  primary key (user_id, week_id, activity)
);

alter table public.completions enable row level security;

create policy "completions: self read"
  on public.completions for select
  using (auth.uid() = user_id);

create policy "completions: professor reads all"
  on public.completions for select
  using (public.is_professor());

create policy "completions: self write"
  on public.completions for insert
  with check (auth.uid() = user_id);

-- ---------- BEFORE/AFTER 비교 설정 ----------
create table public.app_settings (
  key text primary key,
  value jsonb not null
);

alter table public.app_settings enable row level security;

create policy "app_settings: read all authenticated"
  on public.app_settings for select
  using (auth.role() = 'authenticated');

create policy "app_settings: professor writes"
  on public.app_settings for all
  using (public.is_professor())
  with check (public.is_professor());

insert into public.app_settings (key, value) values
  ('before_after_weeks', '{"before": 1, "after": 14}');
