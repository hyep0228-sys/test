"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { studentNoToEmail } from "@/lib/auth";

export async function signUp(formData) {
  const name = formData.get("name")?.toString().trim();
  const studentNo = formData.get("student_no")?.toString().trim();
  const section = formData.get("section")?.toString();
  const nickname = formData.get("nickname")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!name || !studentNo || !section || !nickname || !password) {
    return { error: "모든 항목을 입력해주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: studentNoToEmail(studentNo),
    password,
    options: {
      data: {
        name,
        student_no: studentNo,
        section: Number(section),
        nickname,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/");
}

export async function signIn(formData) {
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
