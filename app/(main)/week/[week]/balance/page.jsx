import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BalanceForm from "./BalanceForm";
import Page from "@/components/Page";

export default async function BalancePage({ params }) {
  const { week: weekParam } = await params;
  const weekId = Number(weekParam);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: week }, { data: questions }, { data: settingsRow }] =
    await Promise.all([
      supabase.from("weeks").select("*").eq("id", weekId).maybeSingle(),
      supabase
        .from("balance_questions")
        .select("*")
        .eq("week_id", weekId)
        .order("order_no", { ascending: true }),
      supabase
        .from("app_settings")
        .select("value")
        .eq("key", "before_after_weeks")
        .maybeSingle(),
    ]);

  const beforeAfter = settingsRow?.value ?? { before: 1, after: 14 };
  const isAfterWeek = weekId === beforeAfter.after;

  const { data: myAnswers } = await supabase
    .from("balance_answers")
    .select("question_id, choice")
    .eq("user_id", user.id)
    .in("question_id", (questions ?? []).map((q) => q.id));

  const answeredMap = new Map((myAnswers ?? []).map((a) => [a.question_id, a.choice]));
  const completed =
    (questions ?? []).length > 0 &&
    (questions ?? []).every((q) => answeredMap.has(q.id));

  let comparisonRows = [];
  if (completed && isAfterWeek) {
    const pairKeys = (questions ?? []).map((q) => q.pair_key).filter(Boolean);
    if (pairKeys.length > 0) {
      const { data: beforeQuestions } = await supabase
        .from("balance_questions")
        .select("*")
        .eq("week_id", beforeAfter.before)
        .in("pair_key", pairKeys);

      const { data: beforeAnswers } = await supabase
        .from("balance_answers")
        .select("question_id, choice")
        .eq("user_id", user.id)
        .in("question_id", (beforeQuestions ?? []).map((q) => q.id));

      const beforeAnsweredMap = new Map(
        (beforeAnswers ?? []).map((a) => [a.question_id, a.choice])
      );

      comparisonRows = (questions ?? [])
        .map((afterQ) => {
          const beforeQ = (beforeQuestions ?? []).find(
            (bq) => bq.pair_key === afterQ.pair_key
          );
          if (!beforeQ || !beforeAnsweredMap.has(beforeQ.id)) return null;
          const beforeChoice = beforeAnsweredMap.get(beforeQ.id);
          const afterChoice = answeredMap.get(afterQ.id);
          const label = (q, c) => (c === "A" ? q.label_a : q.label_b);
          return {
            question: afterQ.question,
            before: label(beforeQ, beforeChoice),
            after: label(afterQ, afterChoice),
          };
        })
        .filter(Boolean);
    }
  }

  if (!week) {
    return (
      <Page>
        <p className="text-mute">해당 주차를 찾을 수 없습니다.</p>
      </Page>
    );
  }

  return (
    <Page>
      <p className="text-sm text-mute mb-1">
        WEEK {String(week.id).padStart(2, "0")}
      </p>
      <h1 className="font-display text-2xl sm:text-3xl mb-2">BALANCE</h1>
      <p className="text-mute mb-10">나의 디자인 취향</p>

      {(questions ?? []).length === 0 && (
        <p className="text-mute">이번 주차에는 등록된 문항이 없습니다.</p>
      )}

      {!completed && (questions ?? []).length > 0 && (
        <BalanceForm
          weekId={week.id}
          questions={questions}
          showReflection={isAfterWeek}
        />
      )}

      {completed && (
        <div className="space-y-6">
          <div className="space-y-3">
            {(questions ?? []).map((q) => (
              <div key={q.id} className="border border-line rounded p-4 bg-white">
                <p className="text-sm text-mute mb-1">{q.question}</p>
                <p className="font-medium">
                  {answeredMap.get(q.id) === "A" ? q.label_a : q.label_b}
                </p>
              </div>
            ))}
          </div>

          {comparisonRows.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-3">BEFORE &amp; AFTER</p>
              <div className="space-y-2">
                {comparisonRows.map((row, i) => (
                  <div
                    key={i}
                    className="border border-line rounded p-4 bg-white text-sm"
                  >
                    <p className="text-mute mb-1">{row.question}</p>
                    <p>
                      {beforeAfter.before}주차: <b>{row.before}</b> → {beforeAfter.after}
                      주차: <b>{row.after}</b>
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-mute mt-3">
                15주 동안 당신이 선택한 경향을 보여줄 뿐, 성격을 단정하지 않습니다.
              </p>
            </div>
          )}
        </div>
      )}

      <p className="mt-10">
        <Link href="/" className="text-accent underline text-sm">
          ← 홈으로
        </Link>
      </p>
    </Page>
  );
}
