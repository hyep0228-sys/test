"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { studentNoToEmail } from "@/lib/auth";

export async function signIn(prevState, formData) {
  const studentNo = formData.get("student_no")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!studentNo || !password) {
    return { error: "학번과 비밀번호를 입력해주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: studentNoToEmail(studentNo),
    password,
  });

  if (error) {
    return { error: "학번 또는 비밀번호가 올바르지 않습니다." };
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
