"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function submitQuizAnswer({ questionId, selectedIndex, isCorrect }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { error } = await supabase.from("quiz_answers").upsert(
    {
      user_id: user.id,
      question_id: questionId,
      selected_index: selectedIndex,
      is_correct: isCorrect,
    },
    { onConflict: "user_id,question_id" }
  );
  if (error) {
    throw new Error(error.message);
  }
}

export async function completeQuiz(weekId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { error } = await supabase
    .from("completions")
    .insert({ user_id: user.id, week_id: weekId, activity: "quiz" });
  if (error && error.code !== "23505") {
    // 23505 = 이미 완료 처리됨(중복), 무시하고 계속 진행
    throw new Error(error.message);
  }

  redirect(`/week/${weekId}/quiz`);
}
