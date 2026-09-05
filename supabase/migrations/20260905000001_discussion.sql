-- =========================================================
-- 팀 논의 공유 — 수업이 일찍 끝난 날에만 여는 주차별 공유판
-- =========================================================
--
-- 조는 그날 앉은 자리대로 랜덤하게 묶이고 인원도 3~5명으로 들쭉날쭉하다.
-- 그래서 조를 테이블로 관리하지 않는다. 글을 올릴 때 그날의 조 이름을
-- 학생이 직접 적어 넣고(`team_name`), 화면에서 그 이름으로 묶어 보여준다.
-- 같은 조원 여러 명이 각자 올려도 한 덩어리로 모인다.

-- 항상 쓰는 기능이 아니라, 교수자가 그날 필요할 때만 연다.
alter table public.weeks
  add column discussion_open boolean not null default false;

create table public.discussion_posts (
  id uuid primary key default gen_random_uuid(),
  week_id smallint not null references public.weeks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  team_name text not null,
  body text,
  link_url text,
  image_path text,
  created_at timestamptz not null default now(),
  -- 셋 다 비어 있는 글은 의미가 없다
  constraint discussion_posts_not_empty check (
    coalesce(btrim(body), '') <> '' or link_url is not null or image_path is not null
  )
);

create index discussion_posts_week_idx
  on public.discussion_posts (week_id, team_name, created_at);

alter table public.discussion_posts enable row level security;

-- 공유가 목적이라 로그인한 사람은 모두 읽는다. 논의를 닫아도 읽기는 남는다
-- (학생이 자기가 올린 것을 나중에 다시 볼 수 있어야 한다).
create policy "discussion_posts: read all authenticated"
  on public.discussion_posts for select
  using (auth.role() = 'authenticated');

-- 쓰기는 본인 이름으로만, 그리고 그 주차의 논의가 열려 있을 때만.
create policy "discussion_posts: self insert while open"
  on public.discussion_posts for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.weeks w
      where w.id = week_id and w.discussion_open
    )
  );

create policy "discussion_posts: self update"
  on public.discussion_posts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 지우기는 본인 또는 교수자(수업 중 잘못 올라온 것 정리용).
create policy "discussion_posts: self or professor deletes"
  on public.discussion_posts for delete
  using (auth.uid() = user_id or public.is_professor());

-- ---------------------------------------------------------
-- 사진 업로드 — 기존 public 버킷 `content` 의 discussions/ 아래만 허용
-- ---------------------------------------------------------
drop policy if exists "content: authenticated uploads discussions" on storage.objects;
create policy "content: authenticated uploads discussions"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'content'
    and (storage.foldername(name))[1] = 'discussions'
  );

drop policy if exists "content: owner or professor deletes discussions" on storage.objects;
create policy "content: owner or professor deletes discussions"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'content'
    and (storage.foldername(name))[1] = 'discussions'
    and (owner = auth.uid() or public.is_professor())
  );
