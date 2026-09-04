import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Page from "@/components/Page";
import ArchiveList from "@/components/ArchiveList";

/**
 * MY ARCHIVE — 학생이 이 수업에서 남긴 것을 한 곳에서 다시 보는 화면.
 *
 * 메모와 질문은 LECTURE 모달 안에서만 쓸 수 있어서, 예전에는 한 번 쓰고 나면
 * 그 주차 모달(253장짜리 덱)을 다시 열지 않는 한 찾을 길이 없었다. 여기가 그 출구다.
 *
 * 아무것도 안 남긴 주차는 아예 안 그린다 — 15주를 전부 나열하면 사이드바와 다를 게 없어진다.
 * 메모는 RLS 상 교수자도 못 읽는다(`lecture_notes` 에 professor 정책이 없다).
 */
export default async function ArchivePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: weeks },
    { data: notes },
    { data: questions },
    { data: answers },
    { data: quizQuestions },
    { data: completions },
  ] = await Promise.all([
    supabase
      .from("weeks")
      .select("id, short_title")
      .order("id", { ascending: true }),
    supabase
      .from("lecture_notes")
      .select("week_id, text, updated_at")
      .eq("user_id", user.id),
    supabase
      .from("lecture_questions")
      .select("id, week_id, page_no, question, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("quiz_answers")
      .select("question_id, is_correct")
      .eq("user_id", user.id),
    // 주차별 총 문항 수를 알아야 "3 / 5 정답"을 쓸 수 있다.
    // 임베드(`quiz_questions(week_id)`) 대신 따로 받아 JS 에서 잇는다 — 지금 몇 행 안 된다.
    supabase.from("quiz_questions").select("id, week_id"),
    supabase
      .from("completions")
      .select("week_id, activity")
      .eq("user_id", user.id)
      .eq("activity", "quiz"),
  ]);

  const noteByWeek = new Map((notes ?? []).map((n) => [n.week_id, n]));

  const questionsByWeek = new Map();
  for (const q of questions ?? []) {
    if (!questionsByWeek.has(q.week_id)) questionsByWeek.set(q.week_id, []);
    questionsByWeek.get(q.week_id).push(q);
  }

  const weekByQuestionId = new Map(
    (quizQuestions ?? []).map((q) => [q.id, q.week_id])
  );
  const totalByWeek = new Map();
  for (const q of quizQuestions ?? []) {
    totalByWeek.set(q.week_id, (totalByWeek.get(q.week_id) ?? 0) + 1);
  }

  const quizByWeek = new Map();
  for (const a of answers ?? []) {
    const weekId = weekByQuestionId.get(a.question_id);
    if (weekId == null) continue;
    if (!quizByWeek.has(weekId)) quizByWeek.set(weekId, { answered: 0, correct: 0 });
    const s = quizByWeek.get(weekId);
    s.answered += 1;
    if (a.is_correct) s.correct += 1;
  }

  const doneWeeks = new Set((completions ?? []).map((c) => c.week_id));

  const rows = (weeks ?? [])
    .map((w) => ({
      week: w,
      note: noteByWeek.get(w.id) ?? null,
      questions: questionsByWeek.get(w.id) ?? [],
      quiz: quizByWeek.get(w.id) ?? null,
      quizTotal: totalByWeek.get(w.id) ?? 0,
      quizDone: doneWeeks.has(w.id),
    }))
    .filter((r) => r.note || r.questions.length > 0 || r.quiz);

  const noteCount = (notes ?? []).length;
  const questionCount = (questions ?? []).length;

  return (
    <Page>
      <h1 className="font-display text-3xl sm:text-4xl mb-1">MY ARCHIVE</h1>
      <p className="text-mute text-sm mb-8 sm:mb-10">
        메모 {noteCount}개 · 질문 {questionCount}개 · 퀴즈 {doneWeeks.size}주차 완료
      </p>

      {rows.length === 0 ? (
        <div className="border border-line rounded-2xl bg-white p-6 sm:p-8">
          <p className="mb-2">아직 남긴 기록이 없습니다.</p>
          <p className="text-mute text-sm leading-relaxed">
            주차 화면의 LECTURE를 열면 오른쪽에서 <b>메모하기</b>와{" "}
            <b>질문남기기</b>를 쓸 수 있어요. 여기에 주차별로 모여서, 시험 전에
            한 번에 다시 볼 수 있습니다.
          </p>
        </div>
      ) : (
        <ArchiveList rows={rows} />
      )}
    </Page>
  );
}
