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
2. **홈 `/`**: 15주 타임라인(`components/WeekTimeline.jsx`). **2026-09-04 재설계** — 예전엔 홈이 열린 주차 중 가장 나중 것을 골라 주차 페이지와 똑같은 `WeekActivityGrid` 를 그려서 `/` 와 `/week/N` 이 픽셀 단위로 같은 화면이었다. 지금 홈은 "과목 전체 중 지금 어디인가"만 보여주고, 활동 버튼은 주차 페이지가 맡는다 — **홈에 LECTURE·QUIZ 를 다시 그리지 말 것.** 노드 상태는 완료(잉크 채움) / 열림(테두리) / 준비 중(흐림) / 시험(점선), '이번 주'는 accent 링. '이번 주'는 날짜가 아니라 **열린 주차 중 가장 나중 것** — 교수자가 사이드바 토글로 주차를 열면 그 주가 이번 주가 된다. 공지란은 두지 않기로 했다(학교 사이트로 갈음). **주차 `/week/[n]`**: 활동 버튼(LECTURE 버튼 아래 QUIZ 카드, 둘 다 `rounded-2xl`) + 완료 체크. `WeekActivityGrid` 컴포넌트. **2026-08-31: 학생에게 보이는 활동은 QUIZ 하나만 남기기로 결정** — BALANCE/THINK/MAKE는 `lib/activities.js`의 `ACTIVITIES` 배열에서 제거해서 그리드에 안 뜨게 했음(코드·DB는 안 지웠음, 나중에 필요하면 배열에 다시 추가하면 됨).
3. **QUIZ** (`/week/[n]/quiz`, `app/actions/quiz.js`, `quiz_questions`/`quiz_answers` 테이블): 한 문제씩 풀고 선택 즉시 정답·해설 표시, 하단에 실시간 정답 개수. 다 풀면 `completions`에 기록되고 이후 재방문 시 점수+전체 리뷰 화면으로 바뀜. **2주차 문제 5개 시딩 완료** — 실제 슬라이드(`public/slides/index.html`의 2주차 섹션) 내용 기반으로 작성(아슐리안 주먹도끼 표준화, 로마 대량생산과 노동분화, 길드의 masterpiece 어원, 구텐베르크 인쇄술, 치펜데일 지침서). 다른 주차는 문제 없음 → `/week/[n]/quiz` 접근 시 "아직 등록된 문제가 없습니다"만 보임.
4. **사이드바** (`components/Sidebar.jsx`): 모바일은 슬라이드 드로어, 데스크톱은 고정. 15주 목록, 닫힌 주차는 학생에게 비활성. 교수자는 전체 열람 가능 + 각 주차 옆 토글 스위치로 즉시 열기/닫기(`app/actions/weeks.js`).
5. **BALANCE** (`/week/[n]/balance`, 코드는 살아있지만 위 결정으로 학생 화면엔 안 뜸): A/B 선택 + 성향 태그 저장, 1주차↔14주차 `pair_key` 매칭으로 BEFORE/AFTER 자동 비교, 14주차엔 자기성찰 서술 질문. URL 직접 치면 여전히 접근은 됨.
6. **수업 슬라이드 덱** — 이 세션이 관여 안 한 다른 세션이 처음부터 다시 구축함. `public/slides/index.html` 정적 HTML 덱(프레임워크 없음), `<iframe src="/slides/index.html?week=N">`으로 허브 앱에 삽입(`components/LectureMaterialButton.jsx`, 버튼 라벨 "LESSON"). **자세한 내용·작업규칙은 `CLAUDE.md` 참고, 여기 안 씀.** 옛 "이미지 페이지 넘김 뷰어"(`lecture_materials` 테이블 기반)는 이걸로 대체됨 — `lecture_materials` 테이블·`/api/lecture-materials`(이 세션이 만들었던 push API)는 삭제된 것으로 보임(`app/api/` 디렉토리 자체가 없어짐), DB 테이블은 안 지워졌을 수 있으니 실제 사용 여부는 스키마 보고 확인할 것. **메모하기**(`lecture_notes`)와 **질문남기기**(`lecture_questions`)는 그대로 유지되어 슬라이드 모달 옆 패널로 붙어있음.
7. **관리자 `/admin`**: 학생 수, 하위 화면 진입 카드, 미처리 질문 건수와 최근 5건. **주차 열림/닫힘 카드 15장은 2026-09-04 에 뺐다** — 사이드바 토글이 같은 정보를 보여주는 데다 조작까지 되니 중복이었다. 질문 전체 목록·필터·처리표시는 **`/admin/questions`** 로 분리했다(상태·주차·분반 필터, 기본값 미처리, 필터는 URL 파라미터). '처리함'은 `lecture_questions.resolved_at` 이고 `app/actions/adminQuestions.js` 가 토글한다. 질문자는 실명+닉네임을 같이 보여준다. 하위 페이지: `/admin/students`(계정 일괄생성), `/admin/slides`(슬라이드 편집, `/admin/slides/[week]/[index]` 포함).
   **2026-09-04 동선 정리** — 파일이 `app/admin/` 에서 **`app/(main)/admin/`** 으로 옮겨졌다(URL 은 그대로 `/admin`). 예전에는 `(main)` 그룹 밖이라 관리자 화면에서 사이드바가 통째로 사라졌고, 주차 열기/닫기 토글이 사이드바에 있어서 토글 한 번 누르려고 홈으로 나갔다 와야 했다. 지금은 사이드바가 그대로 붙는다.
   진입로는 **사이드바 하단 '관리자' 링크**(교수자에게만 보임). 예전에는 링크가 없어 주소창에 직접 쳐야 했다.
   권한 검사는 **`app/(main)/admin/layout.jsx` 한 곳**으로 모았다. 예전엔 관리자 페이지 5곳에 같은 검사가 복붙돼 있어서, 새 페이지에서 빠뜨리면 그대로 뚫리는 구조였다. **admin 아래 새 페이지에는 권한 검사를 따로 쓰지 말 것.**

**주의(2026-08-31)**: 다른 기기/세션이 이 레포에서 슬라이드 작업을 동시에 하고 있음 확인됨. `git add -A`로 한번 그쪽의 임시 파일(`s17b.js`)이 실수로 같이 커밋된 적 있음(바로 다음 커밋에서 삭제해서 정리함). **앞으로는 `git add -A` 대신 건드린 파일만 콕 집어서 add할 것.**

## 레이아웃 규칙 (2026-09-04)

허브 앱 화면은 **모바일·태블릿·데스크톱 세 폭을 모두 맞춘다.** 기준은 아래 두 가지뿐이다.

**1. 본문 폭은 페이지가 정한다.** 예전에는 `app/(main)/layout.jsx` 가 모든 화면을
`max-w-md`(448px) 로 묶어서 데스크톱이 좁은 기둥 하나로 낭비됐다. 지금은 레이아웃이 폭을 안 건다.
페이지는 `<main>` 대신 **`components/Page.jsx`** 를 쓰고 성격에 맞는 폭을 고른다.

| width | 값 | 쓰는 곳 |
|---|---|---|
| `prose`(기본) | `max-w-2xl` | 홈·주차·퀴즈 등 읽기 화면 |
| `wide` | `max-w-4xl` | 아카이브·관리자 등 목록/표 |
| `form` + `center` | `max-w-md`, 세로 가운데 | 로그인·온보딩 |

좌우·위아래 여백(`px-5 sm:px-8`, `py-10 sm:py-14 lg:py-16`)도 `Page` 가 유일한 출처다.
**새 페이지에 `<main className="px-6 py-16">` 를 다시 쓰지 말 것.**

**2. 사이드바 분기점은 `lg`(1024px) 다.** 그 아래는 상단바 + 드로어, 그 이상은 고정 기둥.
예전 분기점은 `md`(768px)라 태블릿 세로에서 256px 사이드바가 본문을 짓눌렀다.
`components/Sidebar.jsx` 의 `DESKTOP_QUERY` 상수가 Tailwind 의 `lg` 와 같은 값이니 **둘을 같이 고칠 것.**

곁들여 고친 것들: 드로어가 닫혔을 땐 `invisible` 이라 화면 밖 링크가 탭 포커스를 훔치지 않는다,
드로어·LECTURE 모달이 열린 동안 뒤 본문 스크롤을 잠근다, 경로가 바뀌면 드로어가 닫힌다,
`100vh` 대신 `dvh` 를 써서 모바일 주소창 높이 변화에 안 튄다, `viewport` 에 `viewportFit:"cover"` +
`globals.css` 의 `.pad-safe-x`/`.pad-safe-b` 로 노치 기기를 피한다.

**LECTURE 모달**: 모바일은 전체화면(`rounded-none`), `sm` 부터 가운데 카드.
메모/질문 패널은 `lg` 미만에서 옆이 아니라 **아래로** 붙는다 — 좁은 화면에서 가로로 나누면 덱이 못 읽을 만큼 작아졌다.

**남은 문제**: 덱(`public/slides/index.html`) 자체는 여전히 프로젝터용 16:9 고정이라
모바일 iframe 안에서 제목이 가로로 잘린다. 허브 셸이 아니라 덱 쪽 작업이고, 아직 안 건드렸다.

## MY ARCHIVE (2026-09-04)

`/archive` 는 예전에 `weeks` 만 조회해 주차 제목 15개를 나열했다 — 사이드바와 다를 게 없는 빈 페이지였다.
지금은 **학생이 남긴 것을 주차별로 모아 보여준다**: 퀴즈 점수(맞힌 수/총 문항, 미완료면 '푸는 중'),
내 메모, 내 질문(슬라이드 페이지 번호·날짜 포함).

**왜 필요했나**: 메모·질문은 LECTURE 모달 안에서만 쓸 수 있어서, 한 번 쓰고 나면 그 주차 모달(253장 덱)을
다시 열지 않는 한 찾을 길이 없었다. 쓰기만 되고 읽기가 막힌 상태였다. 시험 전 복습이 주 용도다.

**아무것도 안 남긴 주차는 아예 안 그린다.** 15주를 전부 나열하면 다시 사이드바와 같아진다.
전부 비어 있으면 어디서 메모·질문을 쓰는지 알려주는 안내 카드가 뜬다.

데이터 수집은 `app/(main)/archive/page.jsx`, 그리기는 `components/ArchiveList.jsx`
(`WeekTimeline` 과 같은 구조). 주차별 퀴즈 총 문항 수는 `quiz_questions` 를 따로 받아 JS 에서 잇는다 —
PostgREST 임베드(`quiz_answers.select("quiz_questions(week_id)")`) 대신 쓴 것이고, 지금 행 수가 적어 충분하다.

**RLS 확인됨(2026-09-04)**: `lecture_questions` 는 학생 본인(`auth.uid() = user_id`)과 교수자(`is_professor()`)만
읽는다 — UI 필터가 아니라 DB 정책이다. `lecture_notes` 에는 **professor 읽기 정책이 없어** 메모는 교수자도 못 본다.
모달의 "나만 볼 수 있어요" 문구가 실제와 맞다. 이 구분을 바꾸려면 마이그레이션이 필요하다.

## DB 스키마 (supabase/migrations/*.sql, 순서대로 적용됨)

`profiles`, `weeks`(15주 시드 포함), `completions`, `app_settings`(before_after_weeks 설정) → `balance_questions/answers/reflections` → `lecture_materials` → `lecture_notes`, `lecture_questions` → `profiles.onboarded`(계정 최초설정 완료 여부, nickname/section은 nullable로 변경) → `quiz_questions`(2주차 5문항 시딩됨)/`quiz_answers`.
Storage 버킷: `content`(수업자료 이미지, public read) 생성됨. `sketches`(MAKE용)는 아직 미생성.

## 마이그레이션 이력 어긋남 — 해결됨 (2026-09-04)

`supabase migration list --linked` 를 돌리면 원격에 **기록된 마이그레이션이 첫 번째(`20260824000001`) 하나뿐**이다.
2~9번은 `remote: ""` 로 나온다. 그런데 서비스 롤 키로 REST 를 찔러보면
`lecture_questions`·`lecture_notes`·`quiz_questions`·`slide_overrides` 가 **전부 실제로 존재한다.**
즉 스키마는 적용됐는데 `supabase_migrations.schema_migrations` 에 기록만 안 된 상태다
(예전 세션이 SQL 에디터에 직접 붙여넣어 적용한 것으로 보인다).

**그래서 `supabase db push` 를 그냥 돌리면 안 된다.** 이미 있는 테이블에 `create table` 을 다시 실행해서
실패하거나 중간까지만 적용된다. 새 마이그레이션을 올리려면 둘 중 하나다.

1. `supabase migration repair --status applied <version>` 으로 2~9번을 "적용됨"으로 기록한 뒤 `db push`
   (이력 테이블만 건드리고 스키마는 안 바꾼다 — 이후 세션이 편해진다)
2. 새 마이그레이션의 SQL 만 대시보드 SQL 에디터에 직접 실행

**2026-09-04 처리함**: 위 1번(`migration repair --status applied` 로 2~9번 기록 → `db push`)으로 정리했고,
`20260904000001_question_resolved.sql`(`lecture_questions.resolved_at` + 교수자 update 정책)까지 원격에 적용·검증했다.
이제 이력과 실제 스키마가 맞으므로 **다음부터는 `supabase db push` 를 그냥 써도 된다.**

## 아직 안 한 것

- **QUIZ 나머지 주차 문제 채우기** (지금 2주차 5문항만 있음, 1·3~15주차는 비어있어서 접속하면 "문제 없음" 뜸)
- THINK/MAKE는 보류 상태(코드는 있으나 학생 화면에서 뺌) — 나중에 다시 켤지, 완전히 갈아엎을지는 미정
- Dashboard 통계 (참여율, 정답률 등)
- CSV 명단 대기 중(수강신청 미완료) — 받는 대로 `/admin/students`에서 계정 생성
