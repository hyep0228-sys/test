-- =========================================================
-- Phase: QUIZ — 오늘 배운 것을 확인
-- =========================================================

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  week_id smallint not null references public.weeks(id) on delete cascade,
  order_no smallint not null default 1,
  question text not null,
  image_url text,
  choices jsonb not null,
  answer_index smallint not null check (answer_index between 0 and 3),
  explanation text
);

alter table public.quiz_questions enable row level security;

create policy "quiz_questions: read all authenticated"
  on public.quiz_questions for select
  using (auth.role() = 'authenticated');

create policy "quiz_questions: professor writes"
  on public.quiz_questions for all
  using (public.is_professor())
  with check (public.is_professor());

create table public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  selected_index smallint not null,
  is_correct boolean not null,
  answered_at timestamptz not null default now(),
  unique (user_id, question_id)
);

alter table public.quiz_answers enable row level security;

create policy "quiz_answers: self read"
  on public.quiz_answers for select
  using (auth.uid() = user_id);

create policy "quiz_answers: professor reads all"
  on public.quiz_answers for select
  using (public.is_professor());

create policy "quiz_answers: self insert"
  on public.quiz_answers for insert
  with check (auth.uid() = user_id);

create policy "quiz_answers: self update"
  on public.quiz_answers for update
  using (auth.uid() = user_id);

-- 2주차: 기원과 장인정신 (선사~18세기)
insert into public.quiz_questions (week_id, order_no, question, choices, answer_index, explanation) values
(2, 1,
 '아슐리안 주먹도끼가 "인류 최초의 표준 디자인"으로 불리는 근거는 무엇인가?',
 '["같은 시기·지역의 주먹도끼들이 크기와 비례가 비슷해서", "가장 날카로운 도구였기 때문에", "가장 먼저 발견된 석기여서", "왕족만 사용할 수 있었기 때문에"]',
 0,
 '같은 시기·같은 지역에서 나온 아슐리안 주먹도끼들은 크기와 비례가 놀랍도록 비슷해, 학자들은 이미 표준화된 형태 규범이 있었다고 본다.'),

(2, 2,
 '로마 시대에 무기와 기름램프를 대량생산하며 나타난 변화는?',
 '["장인이 사라지고 기계가 모든 것을 대체했다", "제작하는 사람과 설계하는 사람이 분리되기 시작했다", "모든 제품이 수작업 맞춤형으로 바뀌었다", "생산이 로마 시내로만 한정됐다"]',
 1,
 '표준화된 도안으로 무기·램프를 공장에서 찍어내면서, 설계와 제작이 갈라지는 노동 분화의 초기 형태가 나타났다.'),

(2, 3,
 '중세 길드 체계에서 "마스터피스(masterpiece)"라는 단어가 원래 뜻하던 것은?',
 '["오늘날처럼 뛰어난 걸작", "장인 자격을 증명하기 위해 제출하는 심사용 작품", "왕에게 바치는 진상품", "도제가 처음 만드는 연습작"]',
 1,
 '장인이 되려면 길드의 심사를 통과할 작품을 제출해야 했는데, 이 심사용 작품을 원래 masterpiece라 불렀다.'),

(2, 4,
 '구텐베르크의 금속활자 인쇄술이 이후 산업혁명의 원리를 앞서 보여준 지점은?',
 '["손으로 그린 그림을 대량 복제할 수 있게 했다", "표준화된 부품(활자)을 조합해 반복 생산하는 방식", "종이 가격을 낮췄다", "왕실 전용 인쇄소를 만들었다"]',
 1,
 '활자는 정해진 규격의 낱개 부품을 조합해 다시 쓰는 방식으로, 표준화된 부품과 반복 생산이라는 원리가 이미 담겨 있었다.'),

(2, 5,
 '치펜데일의 『신사와 가구제작자의 지침서』(1754)가 가구 역사에서 가지는 의미는?',
 '["영국 왕실이 발행한 최초의 가구 규격집", "가구제작자가 자기홍보 수단으로 낸 최초의 가구 디자인서", "최초로 기계로 인쇄된 성경", "프랑스 정부의 가구 수입 금지 조치"]',
 1,
 '치펜데일 연구회에 따르면 이 책은 영국에서 자기홍보 수단으로 가구 디자인서를 출판한 최초의 시도였고, 이후 고객용 카탈로그이자 다른 가구제작자들의 패턴 서적으로도 쓰였다.');
