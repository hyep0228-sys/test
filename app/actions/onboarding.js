"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function completeOnboarding(prevState, formData) {
  const password = formData.get("password")?.toString();
  const passwordConfirm = formData.get("password_confirm")?.toString();
  const nickname = formData.get("nickname")?.toString().trim();
  const section = formData.get("section")?.toString();

  if (!password || !passwordConfirm || !nickname) {
    return { error: "모든 항목을 입력해주세요." };
  }
  if (password.length < 6) {
    return { error: "비밀번호는 6자 이상이어야 합니다." };
  }
  if (password === "000000") {
    return { error: "처음 받은 비밀번호와 다른 것으로 정해주세요." };
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

  // 분반은 보통 계정 만들 때 이미 들어가 있다(출석부가 분반별로 오므로).
  // 비어 있는 계정만 학생에게 묻는다.
  const { data: profile } = await supabase
    .from("profiles")
    .select("section")
    .eq("id", user.id)
    .maybeSingle();

  const update = { nickname, onboarded: true };
  if (!profile?.section) {
    if (!section) return { error: "분반을 골라주세요." };
    update.section = Number(section);
  }

  const { error: passwordError } = await supabase.auth.updateUser({ password });
  if (passwordError) {
    return { error: passwordError.message };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", user.id);
  if (profileError) {
    return { error: profileError.message };
  }

  redirect("/");
}
