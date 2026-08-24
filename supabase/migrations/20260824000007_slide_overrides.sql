-- =========================================================
-- 슬라이드 텍스트 즉시 수정 기능
-- 원본은 /public/slides/index.html에 그대로 두고, 교수자가 /admin/slides에서
-- 고친 슬라이드만 이 테이블에 저장한다. 배포(git push) 없이 바로 반영된다.
-- =========================================================

create table public.slide_overrides (
  week_id smallint not null references public.weeks(id) on delete cascade,
  slide_index smallint not null,
  content_html text not null,
  updated_at timestamptz not null default now(),
  primary key (week_id, slide_index)
);

alter table public.slide_overrides enable row level security;

-- 학생용 뷰어(정적 파일, /slides)가 로그인 세션 없이도 최신 내용을 읽어야 하므로 전체 공개.
-- (강의 자료 자체가 민감정보는 아니며, 기존 lecture_materials 버킷도 공개였다.)
create policy "slide_overrides: read all"
  on public.slide_overrides for select
  using (true);

create policy "slide_overrides: professor writes"
  on public.slide_overrides for all
  using (public.is_professor())
  with check (public.is_professor());
