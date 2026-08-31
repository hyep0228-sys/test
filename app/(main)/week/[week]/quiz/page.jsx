import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import QuizPlayer from "./QuizPlayer";

export default async function QuizPage({ params }) {
  const { week: weekParam } = await params;
  const weekId = Number(weekParam);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: week }, { data: questions }, { data: completion }] =
    await Promise.all([
      supabase.from("weeks").select("*").eq("id", weekId).maybeSingle(),
      supabase
        .from("quiz_questions")
        .select("*")
        .eq("week_id", weekId)
        .order("order_no", { ascending: true }),
      supabase
        .from("completions")
        .select("activity")
        .eq("user_id", user.id)
        .eq("week_id", weekId)
        .eq("activity", "quiz")
        .maybeSingle(),
    ]);

  if (!week) {
    return (
      <main className="px-6 py-16">
        <p className="text-mute">해당 주차를 찾을 수 없습니다.</p>
      </main>
    );
  }

  if ((questions ?? []).length === 0) {
    return (
      <main className="px-6 py-16">
        <p className="text-sm text-mute mb-1">
          WEEK {String(week.id).padStart(2, "0")}
        </p>
        <h1 className="font-display text-3xl mb-6">QUIZ</h1>
        <p className="text-mute">아직 등록된 문제가 없습니다.</p>
      </main>
    );
  }

  const isCompleted = !!completion;

  let myAnswers = [];
  if (isCompleted) {
    const { data } = await supabase
      .from("quiz_answers")
      .select("question_id, selected_index, is_correct")
      .eq("user_id", user.id)
      .in("question_id", questions.map((q) => q.id));
    myAnswers = data ?? [];
  }
  const answerByQuestion = new Map(myAnswers.map((a) => [a.question_id, a]));
  const score = myAnswers.filter((a) => a.is_correct).length;

  return (
    <main className="px-6 py-16">
      <p className="text-sm text-mute mb-1">
        WEEK {String(week.id).padStart(2, "0")}
      </p>
      <h1 className="font-display text-3xl mb-8">QUIZ</h1>

      {isCompleted ? (
        <div>
          <p className="text-lg font-medium mb-8">
            {score} / {questions.length} 정답
          </p>
          <div className="flex flex-col gap-4">
            {questions.map((q) => {
              const my = answerByQuestion.get(q.id);
              return (
                <div
                  key={q.id}
                  className="border border-line rounded-2xl p-4 bg-white"
                >
                  <p className="font-medium mb-3">{q.question}</p>
                  <div className="flex flex-col gap-2 mb-3">
                    {q.choices.map((choice, i) => {
                      let style = "border-line";
                      if (i === q.answer_index) style = "border-accent";
                      else if (my && i === my.selected_index)
                        style = "border-red-400";
                      return (
                        <div
                          key={i}
                          className={`text-sm border rounded-xl px-3 py-2 ${style}`}
                        >
                          {choice}
                          {i === q.answer_index && (
                            <span className="text-accent ml-2">✓ 정답</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {q.explanation && (
                    <p className="text-xs text-mute">{q.explanation}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <QuizPlayer weekId={week.id} questions={questions} />
      )}

      <p className="mt-10">
        <Link href="/" className="text-accent underline text-sm">
          ← 홈으로
        </Link>
      </p>
    </main>
  );
}
