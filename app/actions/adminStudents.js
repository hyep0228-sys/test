"use server";

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { studentNoToEmail } from "@/lib/auth";

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

// CSV 형식: 이름,학번,생년월일뒤4자리  (한 줄에 한 명)
export async function bulkCreateStudents(prevState, formData) {
  try {
    await assertProfessor();
  } catch (e) {
    return { ...initialState, error: e.message };
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

  for (const line of lines) {
    const parts = line.split(",").map((p) => p.trim());
    const [name, studentNo, birthLast4Raw] = parts;

    if (!name || !studentNo || !birthLast4Raw) {
      results.push({ line, status: "실패", detail: "형식 오류 (이름,학번,생년월일뒤4자리)" });
      continue;
    }

    const birthLast4 = birthLast4Raw.padStart(4, "0");
    const tempPassword = `${studentNo}${birthLast4}`;

    const { error } = await supabase.auth.admin.createUser({
      email: studentNoToEmail(studentNo),
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name, student_no: studentNo },
    });

    if (error) {
      results.push({ line, status: "실패", detail: error.message });
    } else {
      results.push({ line, status: "생성됨", detail: `임시비번 ${tempPassword}` });
    }
  }

  return { results, error: null };
}
