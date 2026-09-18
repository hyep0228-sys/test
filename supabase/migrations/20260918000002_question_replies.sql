-- =========================================================
-- 질문 답변 — 질문 하나를 채팅처럼 주고받는다
-- =========================================================
--
-- 그전에는 교수자가 질문을 '처리함'으로 표시할 수만 있고 답을 쓸 곳이 없었다.
-- 한 질문에 답글이 여러 개 달리고, 학생이 다시 물을 수 있게 행 단위로 쌓는다.
--
-- 누가 보나 — 그 질문을 쓴 학생과 교수자 둘뿐이다. 다른 학생에게는 보이지 않는다
-- (`lecture_questions` 자체가 이미 그렇다. 같은 규칙을 답글에도 그대로 건다).

create table public.question_replies (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.lecture_questions(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index question_replies_question_id_idx
  on public.question_replies (question_id, created_at);

alter table public.question_replies enable row level security;

-- 읽기 — 그 질문을 쓴 학생 본인, 그리고 교수자.
create policy "question_replies: owner or professor reads"
  on public.question_replies for select
  using (
    public.is_professor()
    or exists (
      select 1 from public.lecture_questions q
      where q.id = question_id and q.user_id = auth.uid()
    )
  );

-- 쓰기 — 교수자, 그리고 자기 질문에 이어 묻는 학생 본인.
-- author_id 를 자기 자신으로만 적을 수 있게 막는다(남의 이름으로 쓰지 못한다).
create policy "question_replies: owner or professor writes"
  on public.question_replies for insert
  with check (
    author_id = auth.uid()
    and (
      public.is_professor()
      or exists (
        select 1 from public.lecture_questions q
        where q.id = question_id and q.user_id = auth.uid()
      )
    )
  );
