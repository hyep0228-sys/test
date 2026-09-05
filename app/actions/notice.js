"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

import { NOTICE_KEY, NOTICE_MAX_LENGTH } from "@/lib/notice";

// 새 공지를 쓰면 이전 것을 덮고, 비우면 학생 화면에서 사라진다.

export async function saveNotice(prevState, formData) {
  const text = formData.get("text")?.toString().trim() ?? "";

  if (text.length > NOTICE_MAX_LENGTH) {
    return { error: `공지는 ${NOTICE_MAX_LENGTH}자까지 쓸 수 있습니다.` };
  }

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
    return { error: "권한이 없습니다." };
  }

  const { error } = await supabase.from("app_settings").upsert(
    {
      key: NOTICE_KEY,
      value: { text, updated_at: new Date().toISOString() },
    },
    { onConflict: "key" },
  );

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { saved: true, cleared: text === "" };
}
