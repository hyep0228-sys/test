"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { studentNoToEmail, normalizeName } from "@/lib/auth";

export async function signIn(prevState, formData) {
  const studentNo = formData.get("student_no")?.toString().trim();
  const name = formData.get("name")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!studentNo || !name || !password) {
    return { error: "학번·이름·비밀번호를 모두 입력해주세요." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: studentNoToEmail(studentNo),
    password,
  });

  if (error) {
    return { error: "학번 또는 비밀번호가 올바르지 않습니다." };
  }

  // 이름 대조는 **비밀번호를 통과한 뒤에** 한다. 순서를 바꾸면 비밀번호 없이도
  // "이 학번의 이름이 맞나"를 계속 물어볼 수 있는 창구가 된다.
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, onboarded")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile || normalizeName(profile.name) !== normalizeName(name)) {
    await supabase.auth.signOut();
    return { error: "이름이 학번과 일치하지 않습니다.", step: "identity" };
  }

  // 첫 로그인이면 여기서 바로 온보딩으로 보낸다. "/" 로 보내면 프록시가 다시
  // 돌려세우는데, 그 과정에서 주소창만 "/" 로 남고 화면은 온보딩이 뜬다.
  redirect(profile.onboarded ? "/" : "/onboarding");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
