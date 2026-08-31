# 진행 기록 (memory.md)

> Claude Code 세션이 바뀌어도 이어서 작업할 수 있도록 정리한 현재 상태 기록.
> **수업 슬라이드 덱 작업은 이 문서가 아니라 `CLAUDE.md` 를 볼 것.**
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

**배포 방식**: GitHub↔Vercel 자동연결 완료됨 (언제 연결됐는지 이 세션은 모름 — 다른 세션/기기에서 처리된 것으로 보임). `main`에 push하면 Vercel이 알아서 프로덕션 빌드·배포함. `vercel --prod --yes` 수동 배포는 이제 거의 안 써도 되고, 자동배포와 겹치면 "Not authorized"로 실패하는 경우도 있었음(무시해도 됨, git push가 트리거한 배포가 정상 완료됨).

**교수자 계정**: 학번 `20260001` — `role='professor'`로 승격됨 (professor는 사이드바에서 닫힌 주차도 열람 가능, 주차 열기/닫기 토글 노출).

## PROJECT.md 원안 대비 변경된 기술 결정

- **Next.js 14 → 16, React 18 → 19로 업그레이드.** 원안은 14였지만 14.2.15에 미패치 심각 취약점 다수(critical) 발견되어 16으로 올림. `cookies()`, 동적 라우트 `params`가 비동기로 바뀐 부분 전부 반영.
- `middleware.js` → `proxy.js` (Next 16 컨벤션 변경, codemod 대신 수동 마이그레이션).
- 본문 폰트 **Pretendard**(jsdelivr CDN 동적 서브셋 `<link>`), 디스플레이 폰트 **Instrument Serif**(`next/font/google`, 한글은 Pretendard로 폴백).
- `/api/*` 경로는 인증 프록시(`proxy.js`)에서 제외 — 서버-투-서버 API 호출이 로그인 리다이렉트에 걸리는 버그를 고치면서 추가.

## 완료된 기능

1. **인증**: 자유 회원가입 없음 — 교수자가 `/admin/students`에서 `이름,학번,생년월일뒤4자리` CSV를 붙여넣으면 계정이 일괄 생성됨(`app/actions/adminStudents.js`, Supabase Admin API 사용). 초기 비밀번호 = **학번+생년월일뒤4자리** (Supabase 비밀번호 정책이 6자 미만을 거부해서 생년월일 4자리 단독으로는 불가 — 학번을 앞에 붙여 6자 이상 충족). 학생은 학번+임시비번으로 로그인 → `profiles.onboarded=false`면 미들웨어가 무조건 `/onboarding`으로 보내서 새 비밀번호+닉네임+분반을 설정해야 앱을 쓸 수 있음(`app/actions/onboarding.js`). 학번→가짜 이메일 변환은 `{학번}@student.designhistory.app` 그대로 유지. **아직 CSV 명단 미제공(수강신청 대기 중) — 받는 대로 계정 생성 예정.**
2. **홈 `/` · 주차 `/week/[n]`**: 열린 주차의 활동 버튼 + 완료 체크. `WeekActivityGrid` 컴포넌트로 공유. **2026-08-31: 학생에게 보이는 활동은 QUIZ 하나만 남기기로 결정** — BALANCE/THINK/MAKE는 `lib/activities.js`의 `ACTIVITIES` 배열에서 제거해서 그리드에 안 뜨게 했음(코드·DB는 안 지웠음, 나중에 필요하면 배열에 다시 추가하면 됨). QUIZ 자체는 아직 미구현(placeholder).
3. **사이드바** (`components/Sidebar.jsx`): 모바일은 슬라이드 드로어, 데스크톱은 고정. 15주 목록, 닫힌 주차는 학생에게 비활성. 교수자는 전체 열람 가능 + 각 주차 옆 토글 스위치로 즉시 열기/닫기(`app/actions/weeks.js`).
4. **BALANCE** (`/week/[n]/balance`, 코드는 살아있지만 위 결정으로 학생 화면엔 안 뜸): A/B 선택 + 성향 태그 저장, 1주차↔14주차 `pair_key` 매칭으로 BEFORE/AFTER 자동 비교, 14주차엔 자기성찰 서술 질문. URL 직접 치면 여전히 접근은 됨.
5. **수업 슬라이드 덱** — 이 세션이 관여 안 한 다른 세션이 처음부터 다시 구축함. `public/slides/index.html` 정적 HTML 덱(프레임워크 없음), `<iframe src="/slides/index.html?week=N">`으로 허브 앱에 삽입(`components/LectureMaterialButton.jsx`). **자세한 내용·작업규칙은 `CLAUDE.md` 참고, 여기 안 씀.** 옛 "이미지 페이지 넘김 뷰어"(`lecture_materials` 테이블 기반)는 이걸로 대체됨 — `lecture_materials` 테이블·`/api/lecture-materials`(이 세션이 만들었던 push API)는 삭제된 것으로 보임(`app/api/` 디렉토리 자체가 없어짐), DB 테이블은 안 지워졌을 수 있으니 실제 사용 여부는 스키마 보고 확인할 것. **메모하기**(`lecture_notes`)와 **질문남기기**(`lecture_questions`)는 그대로 유지되어 슬라이드 모달 옆 패널로 붙어있음.
6. **관리자 `/admin`**: 주차별 열림/닫힘 상태, 학생 수, 학생이 남긴 질문 전체 목록(닉네임·분반·주차·페이지 포함). 하위 페이지: `/admin/students`(계정 일괄생성), `/admin/slides`(슬라이드 편집 — 다른 세션이 추가, `/admin/slides/[week]/[index]` 라우트도 있음).

## DB 스키마 (supabase/migrations/*.sql, 순서대로 적용됨)

`profiles`, `weeks`(15주 시드 포함), `completions`, `app_settings`(before_after_weeks 설정) → `balance_questions/answers/reflections` → `lecture_materials` → `lecture_notes`, `lecture_questions` → `profiles.onboarded`(계정 최초설정 완료 여부, nickname/section은 nullable로 변경).
Storage 버킷: `content`(수업자료 이미지, public read) 생성됨. `sketches`(MAKE용)는 아직 미생성.

## 아직 안 한 것

- **QUIZ 실제 구현** (스키마도 아직 없음 — 지금 유일하게 학생에게 보이는 활동이라 우선순위 높음)
- THINK/MAKE는 보류 상태(코드는 있으나 학생 화면에서 뺌) — 나중에 다시 켤지, 완전히 갈아엎을지는 미정
- MY ARCHIVE `/archive` 실데이터 연동 (지금은 주차 목록만 나열)
- Dashboard 통계 (참여율, 정답률 등)
- CSV 명단 대기 중(수강신청 미완료) — 받는 대로 `/admin/students`에서 계정 생성
