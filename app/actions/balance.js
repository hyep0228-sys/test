"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function submitBalance(prevState, formData) {
  const weekId = Number(formData.get("week_id"));
  const questionIds = formData.getAll("question_id").map(String);
  const reflection = formData.get("reflection")?.toString().trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const rows = [];
  for (const questionId of questionIds) {
    const choice = formData.get(`choice-${questionId}`)?.toString();
    if (choice !== "A" && choice !== "B") {
      return { error: "모든 문항에 답해주세요." };
    }
    rows.push({ user_id: user.id, question_id: questionId, choice });
  }

  if (rows.length > 0) {
    const { error } = await supabase.from("balance_answers").insert(rows);
    if (error) {
      return { error: error.message };
    }
  }

  if (reflection) {
    const { error } = await supabase
      .from("balance_reflections")
      .insert({ user_id: user.id, week_id: weekId, text: reflection });
    if (error) {
      return { error: error.message };
    }
  }

  await supabase
    .from("completions")
    .insert({ user_id: user.id, week_id: weekId, activity: "balance" });

  redirect(`/week/${weekId}/balance`);
}
