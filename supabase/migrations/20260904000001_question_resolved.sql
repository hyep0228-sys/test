-- =========================================================
-- 학생 질문에 "처리함" 표시 — 교수자가 이미 답한 질문을 구분하기 위해
-- =========================================================
--
-- 관리자 화면의 질문 목록에서 어떤 질문에 이미 답했는지 알 수 없었다.
-- 학생 쪽에는 아무 변화가 없다(자기 질문만 읽는 정책 그대로).

alter table public.lecture_questions
  add column resolved_at timestamptz;

-- 미처리 질문만 걸러 보는 게 기본 동작이라 부분 인덱스를 둔다.
create index lecture_questions_unresolved_idx
  on public.lecture_questions (week_id, created_at desc)
  where resolved_at is null;

-- 기존 정책은 select/insert 뿐이라 교수자도 update 를 못 했다.
create policy "lecture_questions: professor updates"
  on public.lecture_questions for update
  using (public.is_professor())
  with check (public.is_professor());
