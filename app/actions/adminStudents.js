"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { studentNoToEmail, INITIAL_PASSWORD } from "@/lib/auth";

function adminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

async function assertProfessor() {
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
}

const initialState = { results: null, error: null };

/**
 * 출석부 붙여넣기로 계정 일괄 생성. 한 줄에 `이름,학번`.
 *
 * 생년월일은 받지 않는다 — 학교 출석부에 없다. 첫 비밀번호는 모두 `000000` 이고,
 * 학생은 첫 로그인에서 반드시 새로 정한다(`profiles.onboarded=false`).
 * 분반은 줄마다 적지 않고 **파일 단위로 고른다** — 출석부가 분반별로 나뉘어 오기 때문이다.
 */
export async function bulkCreateStudents(prevState, formData) {
  try {
    await assertProfessor();
  } catch (e) {
    return { ...initialState, error: e.message };
  }

  const section = Number(formData.get("section"));
  if (![1, 2, 3].includes(section)) {
    return { ...initialState, error: "분반을 골라주세요." };
  }

  const raw = formData.get("csv")?.toString() ?? "";
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { ...initialState, error: "붙여넣은 내용이 없습니다." };
  }

  const supabase = adminClient();
  const results = [];
  const seen = new Set();

  for (const line of lines) {
    // 탭으로 붙여넣는 경우(엑셀에서 그대로 복사)도 받아준다
    const parts = line.split(/[,\t]/).map((p) => p.trim());
    const [name, studentNo] = parts;

    if (!name || !studentNo) {
      results.push({ line, status: "실패", detail: "형식 오류 (이름,학번)" });
      continue;
    }
    if (!/^\d+$/.test(studentNo)) {
      results.push({ line, status: "실패", detail: `학번이 숫자가 아닙니다: ${studentNo}` });
      continue;
    }
    if (seen.has(studentNo)) {
      results.push({ line, status: "실패", detail: "이 목록 안에 학번이 중복됩니다" });
      continue;
    }
    seen.add(studentNo);

    const { error } = await supabase.auth.admin.createUser({
      email: studentNoToEmail(studentNo),
      password: INITIAL_PASSWORD,
      email_confirm: true,
      user_metadata: { name, student_no: studentNo, section },
    });

    if (error) {
      results.push({ line, status: "실패", detail: error.message });
    } else {
      results.push({ line, status: "생성됨", detail: `${section}분반 · 임시비번 ${INITIAL_PASSWORD}` });
    }
  }

  revalidatePath("/admin/students");
  return { results, error: null };
}

/**
 * 비밀번호 초기화. 가짜 이메일(`{학번}@student.designhistory.app`)이라
 * 재설정 메일을 보낼 곳이 없어서, 교수자가 눌러주는 이 길이 유일하다.
 * 비밀번호를 `000000` 으로 되돌리고 `onboarded` 를 내려, 다음 로그인에서
 * 새 비밀번호를 반드시 정하게 만든다. 닉네임과 분반은 그대로 둔다.
 */
export async function resetStudentPassword(profileId) {
  await assertProfessor();

  const supabase = adminClient();

  const { error: authError } = await supabase.auth.admin.updateUserById(profileId, {
    password: INITIAL_PASSWORD,
  });
  if (authError) throw new Error(authError.message);

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ onboarded: false })
    .eq("id", profileId);
  if (profileError) throw new Error(profileError.message);

  revalidatePath("/admin/students");
}
