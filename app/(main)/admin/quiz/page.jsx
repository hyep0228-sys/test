import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Page from "@/components/Page";

/**
 * 관리자 — 퀴즈 통계.
 *
 * 문항별로 정답률·오답률과 오답이 몰린 보기를 본다. 오답이 한 보기에 몰렸으면 그 보기가
 * 헷갈리게 쓰였거나 수업에서 덜 다룬 대목이라는 뜻이다.
 *
 * **숫자는 늘 세 분반을 합친 전체가 기준이고, 그 아래 분반별로 한 번 더 나눠 보여준다**
 * (2026-09-18 교수자 지시). 분반 수업이 셋이라 어느 반이 덜 따라왔는지가 바로 보여야 한다.
 *
 * 학생 개인은 보여주지 않는다 — 문항을 고치려고 보는 화면이지 학생을 보는 화면이 아니다.
 * 분반은 집계용으로만 쓰고 이름·닉네임은 받지도 않는다.
 *
 * 권한 검사는 `app/(main)/admin/layout.jsx` 가 이미 한다 — 여기 다시 쓰지 않는다.
 */

function pct(n, total) {
  return total === 0 ? 0 : Math.round((n / total) * 100);
}

export default async function AdminQuizPage() {
  const supabase = await createClient();

  const [{ data: weeks }, { data: questions }, { data: answers }, { data: students }] =
    await Promise.all([
      supabase
        .from("weeks")
        .select("id, short_title")
        .order("id", { ascending: true }),
      supabase
        .from("quiz_questions")
        .select("id, week_id, order_no, question, choices, answer_index")
        .order("week_id", { ascending: true })
        .order("order_no", { ascending: true }),
      // 지금 몇백 행이라 통째로 받아 JS 에서 센다. 수천 행이 되면 DB 쪽 집계로 옮길 것.
      supabase
        .from("quiz_answers")
        .select("question_id, selected_index, is_correct, user_id"),
      supabase.from("profiles").select("id, section").eq("role", "student"),
    ]);

  const weekTitleById = new Map((weeks ?? []).map((w) => [w.id, w.short_title]));

  // 분반은 학생 명부에서 뽑는다. 답변 쪽에는 user_id 만 있고 분반이 없다.
  const sectionByUser = new Map((students ?? []).map((s) => [s.id, s.section]));
  const sections = [
    ...new Set((students ?? []).map((s) => s.section).filter((s) => s != null)),
  ].sort((a, b) => a - b);
  const studentTotal = (students ?? []).length;
  const studentCountBySection = new Map(
    sections.map((sec) => [
      sec,
      (students ?? []).filter((s) => s.section === sec).length,
    ])
  );

  function emptyStat(choiceCount) {
    return {
      total: 0,
      correct: 0,
      byChoice: new Array(choiceCount).fill(0),
      bySection: new Map(sections.map((sec) => [sec, { total: 0, correct: 0 }])),
    };
  }

  const statsById = new Map();
  for (const q of questions ?? []) {
    statsById.set(q.id, emptyStat(q.choices.length));
  }
  for (const a of answers ?? []) {
    const s = statsById.get(a.question_id);
    if (!s) continue;
    s.total += 1;
    if (a.is_correct) s.correct += 1;
    if (a.selected_index >= 0 && a.selected_index < s.byChoice.length) {
      s.byChoice[a.selected_index] += 1;
    }
    const sec = s.bySection.get(sectionByUser.get(a.user_id));
    if (sec) {
      sec.total += 1;
      if (a.is_correct) sec.correct += 1;
    }
  }

  // 시험 출제용 목록 — 푼 학생이 있는 문항만, 정답률이 낮은 순으로.
  const hardest = (questions ?? [])
    .map((q) => {
      const s = statsById.get(q.id);
      return { q, s, rate: pct(s.correct, s.total) };
    })
    .filter(({ s }) => s.total > 0)
    .sort((a, b) => a.rate - b.rate || b.s.total - a.s.total);

  // 문항이 있는 주차만 그린다. 15주를 다 나열하면 빈 칸만 길어진다.
  const byWeek = new Map();
  for (const q of questions ?? []) {
    if (!byWeek.has(q.week_id)) byWeek.set(q.week_id, []);
    byWeek.get(q.week_id).push(q);
  }

  const weekRows = [...byWeek.entries()].map(([weekId, list]) => {
    const stats = list.map((q) => statsById.get(q.id));
    const answered = stats.reduce((n, s) => n + s.total, 0);
    const correct = stats.reduce((n, s) => n + s.correct, 0);
    // 그 주차에서 가장 많이 푼 문항의 응답 수 = 푼 학생 수의 근사치(보통 1번 문항이 가장 많다).
    const takers = Math.max(0, ...stats.map((s) => s.total));
    const bySection = sections.map((sec) => {
      const t = stats.reduce((n, s) => n + s.bySection.get(sec).total, 0);
      const c = stats.reduce((n, s) => n + s.bySection.get(sec).correct, 0);
      return { sec, total: t, correct: c };
    });
    return { weekId, list, answered, correct, takers, bySection };
  });

  return (
    <Page width="wide">
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <h1 className="font-display text-2xl sm:text-3xl">퀴즈 통계</h1>
        <Link href="/admin" className="text-sm text-accent shrink-0">
          ← 관리자
        </Link>
      </div>
      <p className="text-mute text-sm mb-8">
        세 분반을 합친 전체가 기준이고, 그 아래 분반별로 나눠 보여줍니다. 학생
        {" "}{studentTotal}명 ({sections.map((s) => `${s}반 ${studentCountBySection.get(s)}명`).join(" · ")}).
        누가 풀었는지는 보지 않습니다.
      </p>

      {/* 시험 출제용 — 정답률이 낮은 문항이 위로 온다(2026-09-18 교수자 요청).
          학생이 어디서 막혔는지가 곧 중간·기말에서 다시 물어야 할 대목이다. */}
      {hardest.length > 0 && (
        <div className="border border-line rounded-xl bg-white p-4 mb-10">
          <p className="text-sm font-medium mb-1">문항 난이도 순</p>
          <p className="text-xs text-mute mb-3">
            정답률이 낮은 문항부터 — 시험 출제 때 다시 물을 대목입니다.
          </p>
          <ul className="space-y-1.5">
            {hardest.map(({ q, s, rate }) => (
              <li
                key={q.id}
                className="flex items-baseline gap-2 text-xs border-b border-line/60 pb-1.5 last:border-0 last:pb-0"
              >
                <span className="text-mute tabular-nums shrink-0 w-16">
                  {String(q.week_id).padStart(2, "0")}주 {q.order_no}번
                </span>
                <span className="min-w-0 flex-1 truncate">{q.question}</span>
                <span className="shrink-0 tabular-nums">
                  정답 {rate}%
                  <span className="text-mute ml-1">({s.correct}/{s.total})</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {weekRows.length === 0 ? (
        <p className="text-mute text-sm">등록된 문항이 없습니다.</p>
      ) : (
        <div className="space-y-10">
          {weekRows.map(({ weekId, list, answered, correct, takers, bySection }) => (
            <section key={weekId}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-3">
                <h2 className="font-medium">
                  <span className="text-[11px] tracking-wide text-mute tabular-nums mr-2">
                    WEEK {String(weekId).padStart(2, "0")}
                  </span>
                  {weekTitleById.get(weekId) ?? ""}
                </h2>
                <p className="text-xs text-mute shrink-0 tabular-nums">
                  {takers === 0
                    ? "아직 푼 학생 없음"
                    : `푼 학생 ${takers}명 · 전체 정답 ${pct(correct, answered)}% · 오답 ${100 - pct(correct, answered)}%`}
                </p>
              </div>

              <div className="space-y-3">
                {list.map((q) => {
                  const s = statsById.get(q.id);
                  const correctPct = pct(s.correct, s.total);
                  return (
                    <div
                      key={q.id}
                      className="border border-line rounded-xl p-4 bg-white"
                    >
                      <p className="text-sm mb-3">
                        <span className="text-mute tabular-nums mr-2">
                          {q.order_no}
                        </span>
                        {q.question}
                      </p>

                      {/* 전체가 먼저, 분반은 그 아래 한 줄. 어느 쪽 숫자인지 말로 적는다. */}
                      <div className="border border-line rounded-lg px-3 py-2 mb-3 bg-paper">
                        <p className="text-sm tabular-nums">
                          <span className="text-mute text-xs mr-2">전체</span>
                          {s.total === 0 ? (
                            <span className="text-mute text-xs">
                              아직 푼 학생이 없습니다
                            </span>
                          ) : (
                            <>
                              정답 {correctPct}%
                              <span className="text-mute mx-2">·</span>
                              오답 {100 - correctPct}%
                              <span className="text-mute text-xs ml-2">
                                (맞힘 {s.correct} / 응답 {s.total}명)
                              </span>
                            </>
                          )}
                        </p>
                        {s.total > 0 && (
                          <p className="text-xs text-mute tabular-nums mt-1.5">
                            {sections.map((sec, i) => {
                              const r = s.bySection.get(sec);
                              return (
                                <span key={sec}>
                                  {i > 0 && <span className="mx-2">·</span>}
                                  {sec}반 정답{" "}
                                  {r.total === 0 ? "—" : `${pct(r.correct, r.total)}%`}
                                  <span className="ml-1">
                                    ({r.correct}/{r.total})
                                  </span>
                                </span>
                              );
                            })}
                          </p>
                        )}
                      </div>

                      <p className="text-[11px] text-mute mb-1.5">
                        보기별 선택 (전체 {s.total}명)
                      </p>
                      <ul className="space-y-1">
                        {q.choices.map((choice, i) => {
                          const n = s.byChoice[i];
                          const share = pct(n, s.total);
                          const isAnswer = i === q.answer_index;
                          return (
                            <li key={i} className="text-xs">
                              <div className="flex items-baseline gap-2">
                                <span
                                  className={`shrink-0 tabular-nums ${
                                    isAnswer ? "text-accent" : "text-mute"
                                  }`}
                                >
                                  {isAnswer ? `정답 ${i + 1}번` : `${i + 1}번`}
                                </span>
                                <span className="min-w-0 flex-1">{choice}</span>
                                <span className="shrink-0 text-mute tabular-nums">
                                  {n}명 · {share}%
                                </span>
                              </div>
                              {/* 모노톤이라 색 대신 굵기로 정답 보기를 구분한다. */}
                              <div className="mt-1 h-1.5 bg-line/40 rounded">
                                <div
                                  className={`h-1.5 rounded ${
                                    isAnswer ? "bg-accent" : "bg-line"
                                  }`}
                                  style={{ width: `${share}%` }}
                                />
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </Page>
  );
}
