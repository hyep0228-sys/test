"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function completeOnboarding(prevState, formData) {
  const password = formData.get("password")?.toString();
  const passwordConfirm = formData.get("password_confirm")?.toString();
  const nickname = formData.get("nickname")?.toString().trim();
  const section = formData.get("section")?.toString();

  if (!password || !passwordConfirm || !nickname || !section) {
    return { error: "모든 항목을 입력해주세요." };
  }
  if (password.length < 6) {
    return { error: "비밀번호는 6자 이상이어야 합니다." };
  }
  if (password !== passwordConfirm) {
    return { error: "비밀번호가 서로 일치하지 않습니다." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error: passwordError } = await supabase.auth.updateUser({
    password,
  });
  if (passwordError) {
    return { error: passwordError.message };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ nickname, section: Number(section), onboarded: true })
    .eq("id", user.id);
  if (profileError) {
    return { error: profileError.message };
  }

  redirect("/");
}
