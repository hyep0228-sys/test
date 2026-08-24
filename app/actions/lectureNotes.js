"use server";

import { createClient } from "@/lib/supabase/server";

export async function saveLectureNote(prevState, formData) {
  const weekId = Number(formData.get("week_id"));
  const text = formData.get("text")?.toString() ?? "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase
    .from("lecture_notes")
    .upsert(
      { user_id: user.id, week_id: weekId, text, updated_at: new Date().toISOString() },
      { onConflict: "user_id,week_id" }
    );

  if (error) {
    return { error: error.message };
  }

  return { saved: true };
}

export async function submitLectureQuestion(prevState, formData) {
  const weekId = Number(formData.get("week_id"));
  const pageNo = formData.get("page_no") ? Number(formData.get("page_no")) : null;
  const question = formData.get("question")?.toString().trim();

  if (!question) {
    return { error: "질문 내용을 입력해주세요." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { data, error } = await supabase
    .from("lecture_questions")
    .insert({ user_id: user.id, week_id: weekId, page_no: pageNo, question })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { submitted: data };
}
