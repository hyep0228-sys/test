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

**교수자 계정**: 학번 `20260001` · 이름 `박지혜` — `role='professor'`로 승격됨 (professor는 사이드바에서
닫힌 주차도 열람 가능, 주차 열기/닫기 토글 노출). **로그인 1단계가 `profiles.name` 을 대조하므로 이름이 맞아야 한다.**
2026-09-07까지 이름이 `테스트 학생` 이었고 그날 실명으로 바꿨다(`profiles.name` 과 auth `user_metadata.name` 둘 다).
닉네임은 아직 `테스트계정` 이다 — 팀 논의에 글을 올리면 그 이름으로 보인다.

## PROJECT.md 원안 대비 변경된 기술 결정

- **Next.js 14 → 16, React 18 → 19로 업그레이드.** 원안은 14였지만 14.2.15에 미패치 심각 취약점 다수(critical) 발견되어 16으로 올림. `cookies()`, 동적 라우트 `params`가 비동기로 바뀐 부분 전부 반영.
- `middleware.js` → `proxy.js` (Next 16 컨벤션 변경, codemod 대신 수동 마이그레이션).
- 본문 폰트 **Pretendard**(jsdelivr CDN 동적 서브셋 `<link>`), 디스플레이 폰트 **Instrument Serif**(`next/font/google`, 한글은 Pretendard로 폴백).
- `/api/*` 경로는 인증 프록시(`proxy.js`)에서 제외 — 서버-투-서버 API 호출이 로그인 리다이렉트에 걸리는 버그를 고치면서 추가.

## 완료된 기능

1. **인증** (2026-09-07 개편): 자유 회원가입 없음. 교수자가 `/admin/students` 에서 **`이름,학번`** 을 붙여넣으면
   계정이 만들어진다(`app/actions/adminStudents.js`, Supabase Admin API). 생년월일은 안 받는다 — 학교 출석부에 없다.
   **분반은 줄마다 적지 않고 붙여넣을 때 고른다** — 출석부가 분반별로 오기 때문이고, 그래서 학생이 분반을 고를 일이 없다.

   **첫 비밀번호는 모두 `000000`.** `0000` 은 안 된다 — Supabase 가 6자 미만을 거부해서 계정 생성 자체가 실패한다.
   상수는 `lib/auth.js` 의 `INITIAL_PASSWORD` 하나뿐이니 바꿀 땐 거기만 고친다.

   **로그인은 2단계**: ① 학번 + 이름 → ② 비밀번호. 1단계는 **서버에 묻지 않는다** — 여기서 대조해주면
   비밀번호 없이 "이 학번의 이름"을 알아내는 창구가 된다. 서버는 **비밀번호를 먼저 확인한 뒤에** 이름을 본다
   (`app/actions/auth.js`). 이름은 공백·대소문자를 지우고 비교한다(`normalizeName`).

   **함정**: 로그인 페이지의 `다음`/`로그인` 버튼에는 `key` 와 `preventDefault` 가 둘 다 필요하다.
   같은 DOM 노드를 재사용하면 onClick 에서 step 이 바뀌는 순간 `type` 이 `submit` 으로 갈아끼워지고,
   브라우저가 그 뒤에 기본 동작을 실행해 **폼이 그대로 제출된다.** 실제로 걸렸다.

   `profiles.onboarded=false` 면 프록시가 `/onboarding` 으로 보낸다. 거기서 **새 비밀번호와 닉네임**을 정한다
   (분반은 이미 있으면 안 묻는다). `000000` 을 그대로 다시 쓰는 것은 막았다.

   **비밀번호 분실 → 교수자가 초기화.** 학번을 가짜 이메일(`{학번}@student.designhistory.app`)로 바꿔 쓰므로
   **재설정 메일을 보낼 곳이 없다.** `/admin/students` 의 학생 목록에서 `비밀번호 초기화` 를 누르면
   `000000` 으로 되돌리고 `onboarded` 를 내려 다음 로그인에서 새로 정하게 한다. 닉네임·분반은 그대로 둔다.

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

**터치 타깃은 최소 44px.** 손가락으로 누르는 컨트롤(알약 버튼, 카드 안 텍스트 링크)에 `min-h-11` 을 준다.
`text-xs px-3 py-1.5` 짜리 알약은 30px, 카드 안 「주차로 →」·「지우기」 같은 텍스트 링크는 16px 이라
폰에서 누르기 어려웠다. 텍스트 링크는 `min-h-11` 에 음수 마진(`-my-3`)을 같이 걸어 히트 영역만 넓히고
줄 높이는 그대로 둔다. 2026-09-05 기준 여섯 폭(375·393·744·820·1180·1440)에서 **가로 넘침 0, 작은 타깃 0**.

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

**「내 메모 내려받기 (.txt)」 버튼(2026-09-14, 커밋 9554b53).** 제목 오른쪽에 붙는다(`components/DownloadNotesButton.jsx`).
메모 기능은 이번 학기까지만 쓰고 종강 후 리셋하므로, 그 전에 학생이 가져가게 한 것이다. 페이지가 이미 받은 본인 메모를
주차 순으로 묶어 `디자인사_내메모.txt` 로 내려준다 — 서버를 다시 부르지 않는다. 맨 앞 BOM 은 윈도 옛 메모장 한글 깨짐 방지.
메모가 없는 학생에게는 버튼이 안 뜬다. 카카오톡 인앱 브라우저에서는 다운로드가 막힐 수 있어 공지에 크롬·사파리로 열라고 적을 것.

## 퀴즈 통계 `/admin/quiz` (2026-09-18)

문항별로 **정답률·오답률과 오답이 몰린 보기**를 본다. **숫자에 '정답'·'오답'을 말로 적는다** —
퍼센트만 있으면 어느 쪽인지 알 수 없다고 교수자가 지적했다(2026-09-18).
**기준은 세 분반을 합친 전체이고, 그 아래 분반별 정답률을 한 줄 더 보여준다**(같은 날 교수자 지시).
분반은 `profiles.section` 에서 가져와 집계에만 쓴다 — 이름·닉네임은 받지 않는다.
맨 위의 **「문항 난이도 순」** 표는 정답률이 낮은 문항부터 세운다. **중간·기말 출제 때 참고하려는 것**이다(교수자 용도).
 오답이 한 보기에 몰렸으면 그 보기가 헷갈리게 쓰였거나
수업에서 덜 다룬 대목이라는 뜻이다. 관리자 홈의 카드에서 들어간다.
**학생이 누구인지는 보여주지 않는다** — 문항을 고치려고 보는 화면이지 학생을 보는 화면이 아니다.
`quiz_answers` 를 통째로 받아 JS 에서 센다(지금 574행). 수천 행이 되면 DB 집계로 옮길 것.
권한 검사는 `app/(main)/admin/layout.jsx` 가 하므로 페이지에 따로 안 썼다.

**4주차 문항 7개는 2026-09-18 에 넣었다.** 덱 100~137장에서 뽑았고 정답 위치를 처음부터 흩었다
(수정궁 공법·수련 잎·실링 데이·공포의 방·장식의 문법·사실주의 관·쿼티 자판).
행 자체는 `SUPABASE_SERVICE_ROLE_KEY` 로 PostgREST 에 직접 넣었고,
`supabase/migrations/20260918000001_quiz_week4.sql` 은 기록·복구용으로 남겼다.

**`supabase` CLI 는 쓸 수 있다 — 멈추는 것은 맥 키체인 잠금이지 DB 비밀번호가 아니다(2026-09-18).**
새 세션에서 `supabase` 명령을 처음 돌리면 맥이 「Supabase CLI 키 접근을 허용하겠냐」고 묻는다.
**여기 넣을 것은 맥 로그인 비밀번호이고, 「항상 허용」을 누르면 그 뒤로는 안 묻는다.**
2026-09-18 세션이 이걸 DB 비밀번호로 착각해 교수자를 Supabase 대시보드로 보냈다 — 헛걸음이었다.
`db push` 는 스키마를 바꾸므로 **에이전트가 자동으로 못 돌린다.** 교수자가 `! npx supabase db push` 로 직접 돌리면 된다.
그 파일은 **4주차에 문항이 하나도 없을 때만** 넣도록 감쌌으니 나중에 `db push` 가 돌아도 두 벌이 되지 않는다.

## 공지 (2026-09-05)

홈 맨 위에 뜨는 **한 칸짜리** 공지. 교수자가 `/admin` 에서 쓰고, 새로 쓰면 이전 것을 덮고,
비우고 저장하면 학생 화면에서 사라진다. 목록이 아니다 — 쌓이면 오래된 걸 정리해야 해서 일부러 한 칸으로 뒀다.

**테이블을 새로 만들지 않았다.** 기존 `app_settings`(key/value jsonb) 에 `key='notice'` 로 얹었다.
그 테이블에 이미 "로그인하면 읽기 / 교수자만 쓰기" RLS 가 걸려 있어 공지에 필요한 조건과 정확히 같다.
값 모양은 `{"text": "...", "updated_at": "ISO8601"}`.

| 파일 | 내용 |
|---|---|
| `lib/notice.js` | `NOTICE_KEY`, `NOTICE_MAX_LENGTH` |
| `app/actions/notice.js` | `saveNotice` |
| `components/NoticeCard.jsx` | 홈에 뜨는 카드 |
| `components/NoticeForm.jsx` | 관리자 편집 칸 |

**상수를 액션 파일에 두지 말 것.** `"use server"` 파일은 async 함수만 export 할 수 있어서
`export const NOTICE_KEY` 를 액션에 두면 빌드가 깨진다("Only async functions are allowed to be exported").
그래서 `lib/notice.js` 로 뺐다.

**참고**: 2026-09-04 에는 "공지는 학교 사이트로 갈음한다"고 정했다가 다음 날 뒤집었다.
지금 기준은 이 항목이다.

## 질문 답변 — 채팅 형식 (2026-09-18)

교수자가 **「처리함」 표시만 되고 답을 쓸 곳이 없다**고 해서 만들었다. 질문 하나가 말풍선 스레드가 된다.
`components/QuestionThread.jsx` 하나를 관리자 화면과 학생 화면이 같이 쓴다 — 말풍선 방향은 보는 사람 기준이다.

- 붙는 곳 — `/admin/questions`(교수자), LECTURE 모달의 질문 패널, MY ARCHIVE(학생).
- **학생도 이어서 물을 수 있다.** 교수자 답변과 학생 되묻기가 한 스레드에 쌓인다.
- 보는 사람 — **그 질문을 쓴 학생과 교수자 둘뿐이다.** 다른 학생에게는 안 보인다(RLS 가 막는다).
- 테이블 `question_replies`(`supabase/migrations/20260918000002_question_replies.sql`).
  `supabase db push` 로 적용했다(2026-09-18).
- 상수는 `lib/questionReplies.js` 에 둔다 — **`use server` 파일은 async 함수만 내보낼 수 있다.**
  액션에 `export const` 를 두었다가 빌드가 5개 오류로 깨졌다(`lib/lectureNotes.js` 와 같은 이유).
- 테이블이 없는 동안에도 화면은 안 깨진다 — 조회가 실패하면 답글 0개로 그린다.

**「처리함」은 되돌릴 수 있다.** `/admin/questions` 에서 상태 필터를 「처리함」으로 두면 그 질문이 보이고,
「처리함 · 되돌리기」 버튼이 미처리로 되돌린다(`toggleQuestionResolved`). 교수자가 잘못 눌렀을 때 쓴다.

## 팀 논의 공유 (2026-09-05)

수업이 **일찍 끝난 날에만** 여는 주차별 공유판. 목적은 오직 공유다 — 교수자가 한 화면을
빔 프로젝터에 띄우면 다 같이 본다. 채점·제출물이 아니다.

**조를 테이블로 만들지 않았다.** 조가 그날 앉은 자리대로 랜덤하게 묶이고 인원도 3~5명으로
들쭉날쭉해서 고정 명단이 성립하지 않는다. 대신 글을 올릴 때 학생이 **조 이름을 직접 적고**
(`team_name`, 자유 입력), 화면에서 그 이름으로 묶는다. 같은 조원 여러 명이 각자 올려도
한 덩어리로 모인다. 이미 올라온 이름은 `datalist` 로 제안해 이름이 갈리는 걸 줄인다.

| 경로 | 내용 |
|---|---|
| `/week/[n]/discussion` | 올리기 폼 + 조별 게시판 |
| `/week/[n]/discussion/present` | **발표 모드** — 한 조씩 크게, ←/→/Space 로 이동, Esc 로 나가기 |
| `app/actions/discussion.js` | 글 작성·삭제, 논의 열기/닫기 |
| `lib/discussion.js` | 조별 묶기, 이미지 public URL 만들기 |

올릴 수 있는 것: **글 · 링크 · 사진**(JPG/PNG/WEBP/GIF, 5MB). 셋 중 하나는 있어야 한다(DB check).
사진은 기존 public 버킷 `content` 의 `discussions/` 아래에 저장한다.

**주의할 점 몇 가지**

- **`weeks.discussion_open`** 이 열림 스위치다. 교수자는 주차 화면과 논의 화면에서 바로 켜고 끈다.
  닫아도 **읽기는 남는다** — 학생이 자기가 올린 걸 나중에 다시 볼 수 있어야 한다. 닫히는 건 쓰기뿐이고,
  RLS 의 insert 정책이 `weeks.discussion_open` 을 직접 확인하므로 UI 를 우회해도 못 쓴다.
- **작성자 닉네임을 글에 복사해 저장한다**(`author_nickname`). `profiles` 는 "본인 행만 읽기"라
  임베드로 가져오면 학생 눈에는 남의 글이 전부 "익명"으로 보였다. 그렇다고 `profiles` select 를 열면
  RLS 가 행 단위라 **닉네임뿐 아니라 이름·학번까지 전교생에게 열린다.** 그래서 열지 않았다.
- **링크는 스킴을 검사한다**(`normalizeLink`). `<a href>` 로 그대로 나가므로 `javascript:` 같은 걸
  막지 않으면 누른 사람 브라우저에서 실행된다. http/https 만 통과시킨다.
- **`content` 버킷은 public 이다.** 올린 사진은 주소를 아는 사람이면 로그인 없이 볼 수 있다(경로는 UUID).
  교실 공유용이라 지금은 이대로 두지만, 민감해지면 비공개 버킷 + 서명 URL 로 바꿔야 한다.
- 발표 모드에서 조 이름은 **`font-sans`** 를 쓴다. 디스플레이 세리프(Instrument Serif)는 라틴 글리프만
  있어서 "1조" 같은 이름의 숫자만 세리프로 튀어 이름이 깨져 보였다.

## 백업 (2026-09-07)

**코드·슬라이드·마이그레이션은 GitHub 에 있다.** 레포는 **PUBLIC** 이다 —
학생 명단, DB 백업 파일, 키를 절대 커밋하지 말 것. `.env.local` 은 `.gitignore` 에 있고
커밋된 파일에 서비스 키가 없는 것을 확인했다. 덱에 박힌 키는 `sb_publishable_...`(공개용)이라 문제없다.

**DB 는 2026-09-07 까지 백업이 하나도 없었다.** `supabase db dump` 는 Docker 가 있어야 하는데
이 기기엔 Docker 도 `pg_dump` 도 없다. 그래서 REST 로 전 테이블을 받는 **`tools/backup.js`** 를 만들었다.

```bash
node tools/backup.js          # ~/design-history-backup/<날짜>/ 에 저장
```

스키마는 `supabase/migrations/` 가 git 에 있으니 **데이터만** 받아도 복구에 충분하다.
비밀키는 스크립트에 없고 `.env.local` 에서 읽는다. **레포 안 경로로는 저장이 막혀 있다**(공개 레포라서).

**한계**: `auth.users` 는 id·이메일·메타데이터만 받고 **비밀번호 해시는 못 받는다.**
최악의 경우 계정을 다시 만들고 전원 `000000` 으로 초기화해야 한다(명단이 있으니 가능).
**Supabase 자체의 자동 백업 여부는 대시보드 → Database → Backups 에서 확인할 것** — 무료 플랜이면 대개 없다.

**자동 예약(2026-09-07 설정)**: macOS launchd 로 **매주 수요일 오전 10시** 자동 실행된다.
수업이 화요일(화4~화7)이라 그 주 활동이 다 담기는 시점이다.

| 항목 | 값 |
|---|---|
| 등록 파일 | `~/Library/LaunchAgents/com.jeehyepark.designhistory-backup.plist` |
| 실행 | `/usr/local/bin/node .../tools/backup.js` |
| 로그 | `~/design-history-backup/_log/backup.log` · `backup.err` |

**2026-09-09 예약 실행이 실패했다** — `getaddrinfo ENOTFOUND`. 맥이 그 시각에 막 깨어나
아직 네트워크가 안 붙은 상태였고, 스크립트는 즉시 죽으면서 **빈 폴더만 남겼다**(백업이 된 것처럼 보였다).
어제 수업의 메모 75건이 백업 없이 하루를 보냈다. 고친 것: 모든 요청을 **1분 간격 12번 재시도**로 감싸고,
**연결이 확인된 뒤에야 폴더를 만든다.** 실패하면 종료코드 1과 함께 이유를 한 줄로 남긴다.
그래도 실패할 수 있으니 **수업 다음 날에는 `_log/backup.err` 를 한 번 볼 것.**

맥이 꺼져 있었으면 다음에 켤 때 한 번 돈다. 확인은 `launchctl list | grep designhistory`,
끄려면 `launchctl unload ~/Library/LaunchAgents/com.jeehyepark.designhistory-backup.plist`.
**node 경로가 바뀌면 조용히 실패한다** — 이상하면 `backup.err` 부터 볼 것.

## DB 스키마 (supabase/migrations/*.sql, 순서대로 적용됨)

`profiles`, `weeks`(15주 시드 포함), `completions`, `app_settings`(before_after_weeks 설정) → `balance_questions/answers/reflections` → `lecture_materials` → `lecture_notes`, `lecture_questions` → `profiles.onboarded`(계정 최초설정 완료 여부, nickname/section은 nullable로 변경) → `quiz_questions`(2주차 5문항 시딩됨)/`quiz_answers` → `lecture_questions.resolved_at` → `weeks.discussion_open`/`discussion_posts`.
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

## 종강 후 재편 계획 (2026-09-14 교수자와 논의, 2026-2학기 끝나고 한다)

**학기 중에는 손대지 않는다.** 수업 중인 DB 를 바꾸면 위험하고, 시험용 DB 도 없다(Vercel Preview 도 실제 DB 에 붙어 있다).
미술사는 2027-1학기 개강이라 1월에 시작해 **개강 2~3주 전에는 끝낸다.**

**방향: 로그인 없이 사이트를 열어둔다.** 교수자가 학생 개인 데이터를 보관하는 것을 위험하다고 봤다.

| 기능 | 다음 학기 |
|---|---|
| 개인별 메모 | **없앤다.** 종강 후 `lecture_notes` 리셋. **맥의 DB 백업 파일에 든 메모도 같이 지울 것** |
| 퀴즈 | **공개, 연습용.** 풀고 바로 정답 확인. 점수·완료 기록 안 남김, 정답 공개돼도 됨 |
| 질문 남기기 | **로그인 없이 남기고 교수자만 본다.** 답글 기능 없음 — 교수자가 수업 시간에 공식적으로 답한다 |
| 토론 | **미정 — 교수자가 더 생각해보기로 함** |
| 완료 표시·MY ARCHIVE | 로그인이 없으니 없어진다 |
| 학생 계정 | 필요 없어진다(명단 업로드·비밀번호 초기화도) |

**질문을 로그인 없이 받을 때 챙길 것.** 누구나 쓸 수 있으니 장난·도배를 막을 장치가 필요하다 —
글자 수 상한, 같은 곳에서 연달아 쓰기 제한, 쓰기만 되고 읽기는 교수자만 되는 RLS(anon 은 insert 만).
주차·슬라이드 번호는 지금처럼 같이 받는다.

**미술사(1학기)를 어떻게 넣을지는 아직 안 정했다.** 두 수업의 학생은 완전히 다르고, 기능은 디자인사와 비슷하게 쓴다.
한 링크 안에 과목별 갈래(`/art`, `/design`)로 넣는 쪽을 추천했다 — 코드와 DB 를 두 벌 관리하지 않아도 된다.
**학생 데이터가 없어지면 이 작업이 크게 가벼워진다.** 지금 테이블은 전부 `weeks.id`(1~15, check 제약)를 기준으로 묶여 있어
과목을 넣으려면 그 기준을 바꿔야 하는데, 남는 것이 슬라이드·퀴즈 문항·질문뿐이면 옮길 데이터가 적다.
토론을 정한 뒤 합칠지 뺄지 다시 판단한다. 슬라이드도 과목별로 나눠야 한다(`public/slides/` 아래).

## 아직 안 한 것

- **QUIZ 나머지 주차 문제 채우기** (2주차 5문항·3주차 6문항·**4주차 7문항**(2026-09-18) 있음, 1·5~15주차는 비어있어서 접속하면 "문제 없음" 뜸)
  **문항을 넣을 때 정답 위치를 흩을 것** — 화면(`QuizPlayer`)이 보기를 섞지 않고 저장된 순서대로 그린다.
  그리고 **답이 들어온 뒤에는 보기 순서를 바꾸지 말 것**: `quiz_answers.selected_index` 가 위치를 가리켜서
  이미 채점된 답이 엉뚱한 보기를 가리키게 된다.
- THINK/MAKE는 보류 상태(코드는 있으나 학생 화면에서 뺌) — 나중에 다시 켤지, 완전히 갈아엎을지는 미정
- Dashboard 통계 (참여율, 정답률 등)
- CSV 명단 대기 중(수강신청 미완료) — 받는 대로 `/admin/students`에서 계정 생성
- **맥이 꺼져 있어도 도는 백업 — 논의만 하고 아직 안 만들었다.** 지금 백업은 launchd 라
  맥이 켜져 있어야만 돈다(2026-09-09에 실제로 놓쳤다). 정한 방향은 **비공개 GitHub 레포 +
  Actions 스케줄**이다 — 무료이고 맥과 무관하며 `tools/backup.js` 를 거의 그대로 쓴다.
  **지금 레포(`hyep0228-sys/test`)에 붙이면 안 된다. 공개라서 Actions 산출물을 아무나 내려받는다.**
  서비스 롤 키를 GitHub Secrets 에 넣어야 하고, 비공개 레포 생성과 Secrets 등록은 교수자 계정 작업이다.
  (Supabase Pro 로 올리면 자동 백업이 붙고, 지금 스크립트가 못 받는 **비밀번호 해시**까지 지킨다.
  현재 방식으로 복구하면 전원 `000000` 초기화가 필요하다. 플랜은 대시보드 → Settings → Billing 에서 확인.)
