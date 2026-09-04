"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * 학생 질문을 "처리함"으로 표시하거나 되돌린다. 교수자 전용.
 *
 * DB 쪽에도 `lecture_questions: professor updates` 정책이 걸려 있어서
 * 여기 검사를 통과해도 교수자가 아니면 업데이트가 실제로 막힌다.
 */
export async function toggleQuestionResolved(questionId, nextResolved) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id)
    .maybeSingle();

  if (profile?.role !== "professor") {
    throw new Error("권한이 없습니다.");
  }

  const { error } = await supabase
    .from("lecture_questions")
    .update({ resolved_at: nextResolved ? new Date().toISOString() : null })
    .eq("id", questionId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
}
