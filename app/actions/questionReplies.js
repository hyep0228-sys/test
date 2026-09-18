"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { REPLY_MAX_LENGTH } from "@/lib/questionReplies";

/**
 * 질문 하나에 답글을 단다 — 교수자와 그 질문을 쓴 학생 본인만.
 *
 * DB 쪽 `question_replies` 정책이 같은 조건을 다시 건다. 여기 검사를 지나도
 * 남의 질문에는 실제로 쓰이지 않는다.
 */
export async function postQuestionReply(prevState, formData) {
  const questionId = formData.get("question_id")?.toString();
  const body = formData.get("body")?.toString().trim();

  if (!questionId) return { error: "질문을 찾을 수 없습니다." };
  if (!body) return { error: "답변 내용을 입력해주세요." };
  if (body.length > REPLY_MAX_LENGTH) {
    return { error: `답변은 ${REPLY_MAX_LENGTH.toLocaleString()}자까지 쓸 수 있습니다.` };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "로그인이 필요합니다." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, nickname")
    .eq("id", user.id)
    .maybeSingle();

  const { data, error } = await supabase
    .from("question_replies")
    .insert({ question_id: questionId, author_id: user.id, body })
    .select("id, question_id, author_id, body, created_at")
    .single();

  if (error) return { error: error.message };

  // 화면이 바로 말풍선을 그릴 수 있게 글쓴이 정보를 붙여 돌려준다.
  revalidatePath("/admin/questions");
  revalidatePath("/archive");
  return {
    reply: {
      ...data,
      profiles: { role: profile?.role ?? "student", nickname: profile?.nickname ?? null },
    },
  };
}
