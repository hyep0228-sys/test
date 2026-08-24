-- =========================================================
-- 수업자료 모달 — 개인 메모 & 질문남기기
-- =========================================================

create table public.lecture_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  week_id smallint not null references public.weeks(id) on delete cascade,
  text text not null,
  updated_at timestamptz not null default now(),
  unique (user_id, week_id)
);

alter table public.lecture_notes enable row level security;

create policy "lecture_notes: self read"
  on public.lecture_notes for select
  using (auth.uid() = user_id);

create policy "lecture_notes: self write"
  on public.lecture_notes for insert
  with check (auth.uid() = user_id);

create policy "lecture_notes: self update"
  on public.lecture_notes for update
  using (auth.uid() = user_id);

create table public.lecture_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  week_id smallint not null references public.weeks(id) on delete cascade,
  page_no smallint,
  question text not null,
  created_at timestamptz not null default now()
);

alter table public.lecture_questions enable row level security;

create policy "lecture_questions: self read"
  on public.lecture_questions for select
  using (auth.uid() = user_id);

create policy "lecture_questions: professor reads all"
  on public.lecture_questions for select
  using (public.is_professor());

create policy "lecture_questions: self write"
  on public.lecture_questions for insert
  with check (auth.uid() = user_id);
