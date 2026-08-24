-- =========================================================
-- 수업자료 다시보기 (주차별 페이지 넘김 뷰어)
-- =========================================================

create table public.lecture_materials (
  id uuid primary key default gen_random_uuid(),
  week_id smallint not null references public.weeks(id) on delete cascade,
  order_no smallint not null default 1,
  image_url text not null
);

alter table public.lecture_materials enable row level security;

create policy "lecture_materials: read all authenticated"
  on public.lecture_materials for select
  using (auth.role() = 'authenticated');

create policy "lecture_materials: professor writes"
  on public.lecture_materials for all
  using (public.is_professor())
  with check (public.is_professor());
