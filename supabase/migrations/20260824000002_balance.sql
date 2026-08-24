-- =========================================================
-- Phase 4: BALANCE — 나의 디자인 취향
-- =========================================================

create table public.balance_questions (
  id uuid primary key default gen_random_uuid(),
  week_id smallint not null references public.weeks(id) on delete cascade,
  order_no smallint not null default 1,
  question text not null,
  image_a_url text,
  label_a text not null,
  image_b_url text,
  label_b text not null,
  tag_a text not null,
  tag_b text not null,
  pair_key text
);

alter table public.balance_questions enable row level security;

create policy "balance_questions: read all authenticated"
  on public.balance_questions for select
  using (auth.role() = 'authenticated');

create policy "balance_questions: professor writes"
  on public.balance_questions for all
  using (public.is_professor())
  with check (public.is_professor());

create table public.balance_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.balance_questions(id) on delete cascade,
  choice text not null check (choice in ('A','B')),
  answered_at timestamptz not null default now(),
  unique (user_id, question_id)
);

alter table public.balance_answers enable row level security;

create policy "balance_answers: self read"
  on public.balance_answers for select
  using (auth.uid() = user_id);

create policy "balance_answers: professor reads all"
  on public.balance_answers for select
  using (public.is_professor());

create policy "balance_answers: self write"
  on public.balance_answers for insert
  with check (auth.uid() = user_id);

create table public.balance_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  week_id smallint not null references public.weeks(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now(),
  unique (user_id, week_id)
);

alter table public.balance_reflections enable row level security;

create policy "balance_reflections: self read"
  on public.balance_reflections for select
  using (auth.uid() = user_id);

create policy "balance_reflections: professor reads all"
  on public.balance_reflections for select
  using (public.is_professor());

create policy "balance_reflections: self write"
  on public.balance_reflections for insert
  with check (auth.uid() = user_id);

-- 1주차·14주차 짝지어진 샘플 문항 (BEFORE & AFTER 데모용, 교수자가 관리자 화면에서 추후 교체 가능)
insert into public.balance_questions (week_id, order_no, question, label_a, label_b, tag_a, tag_b, pair_key) values
  (1,  1, '더 끌리는 의자는?', '장식이 화려한 의자', '군더더기 없는 의자', '장식성', '기능성', 'chair_ornament_function'),
  (14, 1, '더 끌리는 의자는?', '장식이 화려한 의자', '군더더기 없는 의자', '장식성', '기능성', 'chair_ornament_function');
