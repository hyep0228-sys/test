import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Page from "@/components/Page";

/**
 * 관리자 — 퀴즈 통계.
 *
 * 문항별로 몇 명이 풀었고 몇 %가 맞혔는지, 틀린 학생이 어느 보기로 갔는지 본다.
 * 오답이 한 보기에 몰렸다면 그 보기가 헷갈리게 쓰였거나 수업에서 덜 다룬 대목이다.
 *
 * 권한 검사는 `app/(main)/admin/layout.jsx` 가 이미 한다 — 여기 다시 쓰지 않는다.
 * 학생이 누구인지는 보지 않는다. 문항을 고치려고 보는 화면이지 학생을 보는 화면이 아니다.
 */
export default async function AdminQuizPage() {
  const supabase = await createClient();

  const [{ data: weeks }, { data: questions }, { data: answers }] =
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
      supabase.from("quiz_answers").select("question_id, selected_index, is_correct"),
    ]);

  const weekTitleById = new Map((weeks ?? []).map((w) => [w.id, w.short_title]));

  // 문항별 집계: 보기별 선택 수와 정답 수.
  const statsById = new Map();
  for (const q of questions ?? []) {
    statsById.set(q.id, {
      total: 0,
      correct: 0,
      byChoice: new Array(q.choices.length).fill(0),
    });
  }
  for (const a of answers ?? []) {
    const s = statsById.get(a.question_id);
    if (!s) continue;
    s.total += 1;
    if (a.is_correct) s.correct += 1;
    if (a.selected_index >= 0 && a.selected_index < s.byChoice.length) {
      s.byChoice[a.selected_index] += 1;
    }
  }

  // 문항이 있는 주차만 그린다. 15주를 다 나열하면 빈 칸만 길어진다.
  const byWeek = new Map();
  for (const q of questions ?? []) {
    if (!byWeek.has(q.week_id)) byWeek.set(q.week_id, []);
    byWeek.get(q.week_id).push(q);
  }

  const weekRows = [...byWeek.entries()].map(([weekId, list]) => {
    const totals = list.map((q) => statsById.get(q.id));
    const answered = totals.reduce((n, s) => n + s.total, 0);
    const correct = totals.reduce((n, s) => n + s.correct, 0);
    // 그 주차에서 가장 많이 푼 문항 수 = 응시 인원의 근사치(1번 문항이 보통 가장 많다).
    const takers = Math.max(0, ...totals.map((s) => s.total));
    return { weekId, list, answered, correct, takers };
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
        문항별 정답률과 오답이 몰린 보기를 봅니다. 누가 풀었는지는 보지 않습니다.
      </p>

      {weekRows.length === 0 ? (
        <p className="text-mute text-sm">등록된 문항이 없습니다.</p>
      ) : (
        <div className="space-y-8">
          {weekRows.map(({ weekId, list, answered, correct, takers }) => (
            <section key={weekId}>
              <div className="flex items-baseline justify-between gap-3 mb-3">
                <h2 className="font-medium">
                  <span className="text-[11px] tracking-wide text-mute tabular-nums mr-2">
                    WEEK {String(weekId).padStart(2, "0")}
                  </span>
                  {weekTitleById.get(weekId) ?? ""}
                </h2>
                <p className="text-xs text-mute shrink-0 tabular-nums">
                  {takers === 0
                    ? "아직 푼 학생 없음"
                    : `${takers}명 · 전체 정답률 ${Math.round((correct / answered) * 100)}%`}
                </p>
              </div>

              <div className="space-y-3">
                {list.map((q) => {
                  const s = statsById.get(q.id);
                  const rate =
                    s.total === 0 ? null : Math.round((s.correct / s.total) * 100);
                  return (
                    <div
                      key={q.id}
                      className="border border-line rounded-xl p-4 bg-white"
                    >
                      <div className="flex items-baseline justify-between gap-3 mb-2">
                        <p className="text-sm">
                          <span className="text-mute tabular-nums mr-2">
                            {q.order_no}
                          </span>
                          {q.question}
                        </p>
                        <p className="text-sm shrink-0 tabular-nums">
                          {rate === null ? (
                            <span className="text-mute text-xs">미응답</span>
                          ) : (
                            <>
                              {rate}%
                              <span className="text-mute text-xs ml-1">
                                ({s.correct}/{s.total})
                              </span>
                            </>
                          )}
                        </p>
                      </div>

                      <ul className="space-y-1">
                        {q.choices.map((choice, i) => {
                          const n = s.byChoice[i];
                          const pct = s.total === 0 ? 0 : (n / s.total) * 100;
                          const isAnswer = i === q.answer_index;
                          return (
                            <li key={i} className="text-xs">
                              <div className="flex items-baseline gap-2">
                                <span
                                  className={`shrink-0 tabular-nums ${
                                    isAnswer ? "text-accent" : "text-mute"
                                  }`}
                                >
                                  {isAnswer ? "정답" : `${i + 1}번`}
                                </span>
                                <span className="min-w-0 flex-1">{choice}</span>
                                <span className="shrink-0 text-mute tabular-nums">
                                  {n}명 · {Math.round(pct)}%
                                </span>
                              </div>
                              {/* 막대는 색이 아니라 굵기로 구분한다 — 덱과 같은 모노톤이다. */}
                              <div className="mt-1 h-1.5 bg-line/40 rounded">
                                <div
                                  className={`h-1.5 rounded ${
                                    isAnswer ? "bg-accent" : "bg-line"
                                  }`}
                                  style={{ width: `${pct}%` }}
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
