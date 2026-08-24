-- =========================================================
-- 관리자 일괄 계정 생성 + 최초 로그인 온보딩(비밀번호 변경/닉네임/분반)
-- =========================================================

alter table public.profiles alter column nickname drop not null;
alter table public.profiles alter column section drop not null;

alter table public.profiles
  add column onboarded boolean not null default false;

-- 이미 닉네임/분반이 채워져 있는 기존 계정(자유가입 시절)은 온보딩 완료로 간주
update public.profiles
set onboarded = true
where nickname is not null and section is not null;
