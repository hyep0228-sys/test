"use server";

import { createClient } from "@/lib/supabase/server";
import { NOTE_MAX_LENGTH } from "@/lib/lectureNotes";

export async function saveLectureNote(prevState, formData) {
  const weekId = Number(formData.get("week_id"));
  const text = formData.get("text")?.toString() ?? "";

  // 칸에도 maxLength 를 걸어뒀지만, 액션은 직접 호출될 수 있으니 여기서 다시 본다.
  if (text.length > NOTE_MAX_LENGTH) {
    return { error: `메모는 ${NOTE_MAX_LENGTH.toLocaleString()}자까지 쓸 수 있습니다.` };
  }

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
