# 진행 기록 (memory.md)

> Claude Code 세션이 바뀌어도 이어서 작업할 수 있도록 정리한 현재 상태 기록.
> PROJECT.md는 최초 기획서, 이 파일은 실제로 무엇을 했고 지금 뭐가 남았는지의 로그.

## 인프라

| 항목 | 값 |
|---|---|
| GitHub | `hyep0228-sys/test` (Public), `main` 브랜치 |
| Supabase 프로젝트 | `design-history-app`, region `ap-northeast-2`(Seoul), ref `jsrszfulaxmymgoexuki` |
| Vercel 프로젝트 | `design-history-app` (team `1234-26e1`) |
| Production URL | https://design-history-app.vercel.app |

**환경변수** (Vercel Production+Preview에 설정됨, `.env.local`에도 로컬 보관 — git에는 미포함):
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LECTURE_MATERIALS_API_KEY`

**배포 방식**: GitHub↔Vercel 자동연결은 브라우저 승인이 안 돼서(CLI 한계) 아직 수동. 코드 수정 후 `vercel --prod --yes`로 매번 직접 배포 중. 자동배포 원하면 https://vercel.com/1234-26e1/design-history-app/settings/git 에서 한 번 연결 필요.

**교수자 계정**: 학번 `20260001` — `role='professor'`로 승격됨 (professor는 사이드바에서 닫힌 주차도 열람 가능, 주차 열기/닫기 토글 노출).

## PROJECT.md 원안 대비 변경된 기술 결정

- **Next.js 14 → 16, React 18 → 19로 업그레이드.** 원안은 14였지만 14.2.15에 미패치 심각 취약점 다수(critical) 발견되어 16으로 올림. `cookies()`, 동적 라우트 `params`가 비동기로 바뀐 부분 전부 반영.
- `middleware.js` → `proxy.js` (Next 16 컨벤션 변경, codemod 대신 수동 마이그레이션).
- 본문 폰트 **Pretendard**(jsdelivr CDN 동적 서브셋 `<link>`), 디스플레이 폰트 **Instrument Serif**(`next/font/google`, 한글은 Pretendard로 폴백).
- `/api/*` 경로는 인증 프록시(`proxy.js`)에서 제외 — 서버-투-서버 API 호출이 로그인 리다이렉트에 걸리는 버그를 고치면서 추가.

## 완료된 기능

1. **인증**: 자유 회원가입 없음 — 교수자가 `/admin/students`에서 `이름,학번,생년월일뒤2자리` CSV를 붙여넣으면 계정이 일괄 생성됨(`app/actions/adminStudents.js`, Supabase Admin API 사용). 초기 비밀번호 = **학번+생년월일뒤2자리**. 학생은 학번+임시비번으로 로그인 → `profiles.onboarded=false`면 미들웨어가 무조건 `/onboarding`으로 보내서 새 비밀번호+닉네임+분반을 설정해야 앱을 쓸 수 있음(`app/actions/onboarding.js`). 학번→가짜 이메일 변환은 `{학번}@student.designhistory.app` 그대로 유지.
2. **홈 `/` · 주차 `/week/[n]`**: 열린 주차의 QUIZ/BALANCE/THINK/MAKE 4버튼 그리드 + 완료 체크. `WeekActivityGrid` 컴포넌트로 공유.
3. **사이드바** (`components/Sidebar.jsx`): 모바일은 슬라이드 드로어, 데스크톱은 고정. 15주 목록, 닫힌 주차는 학생에게 비활성. 교수자는 전체 열람 가능 + 각 주차 옆 토글 스위치로 즉시 열기/닫기(`app/actions/weeks.js`).
4. **BALANCE** (`/week/[n]/balance`): A/B 선택 + 성향 태그 저장, 1주차↔14주차 `pair_key` 매칭으로 BEFORE/AFTER 자동 비교, 14주차엔 자기성찰 서술 질문 추가. (QUIZ/THINK/MAKE는 아직 플레이스홀더.)
5. **수업자료 다시보기 모달** (`components/LectureMaterialButton.jsx`): 주차별 이미지 페이지 넘김 뷰어(96vw×92vh), 좌우 화살표/키보드 네비게이션. 우측 패널로 **메모하기**(개인 전용, `lecture_notes`)와 **질문남기기**(교수자만 열람, `lecture_questions`) 지원.
6. **관리자 `/admin`**: 주차별 열림/닫힘 상태, 학생 수, 학생이 남긴 질문 전체 목록(닉네임·분반·주차·페이지 포함).
7. **수업자료 업데이트 API** (`POST /api/lecture-materials`, `x-api-key` 헤더 인증): `{week_id, images: string[]}`를 보내면 해당 주차 자료를 통째로 교체. 지금은 "우리가 API를 열어두는" push 방식으로 만들어뒀는데, 실제로는 **콘텐츠를 만드는 다른 에이전트의 API를 우리가 호출(pull)하는 방향이 맞다고 방향 전환 결정** — 그 에이전트의 API 스펙(엔드포인트/인증/응답 형식)을 받는 대로 동기화 로직으로 교체 예정. 지금 push용 엔드포인트는 fallback으로 남겨둠.

## DB 스키마 (supabase/migrations/*.sql, 순서대로 적용됨)

`profiles`, `weeks`(15주 시드 포함), `completions`, `app_settings`(before_after_weeks 설정) → `balance_questions/answers/reflections` → `lecture_materials` → `lecture_notes`, `lecture_questions` → `profiles.onboarded`(계정 최초설정 완료 여부, nickname/section은 nullable로 변경).
Storage 버킷: `content`(수업자료 이미지, public read) 생성됨. `sketches`(MAKE용)는 아직 미생성.

## 아직 안 한 것

- QUIZ / THINK / MAKE 실제 구현 (스키마도 아직 없음 — PROJECT.md 섹션 5 "다음 Phase" 참고)
- MY ARCHIVE `/archive` 실데이터 연동 (지금은 주차 목록만 나열)
- 관리자 콘텐츠 CRUD 화면 (지금은 DB에 직접 넣는 방식)
- Dashboard 통계 (참여율, 정답률, BALANCE 분포 등)
- 다른 에이전트의 수업자료 생성 API 연동 (스펙 대기 중)
- `sketches` Storage 버킷, MAKE 캔버스 구현
