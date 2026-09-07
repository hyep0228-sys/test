import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Page from "@/components/Page";
import BulkCreateForm from "./BulkCreateForm";
import ResetPasswordButton from "@/components/ResetPasswordButton";
import StudentSearch from "@/components/StudentSearch";

export default async function AdminStudentsPage({ searchParams }) {
  const sp = await searchParams;
  const q = (sp?.q ?? "").toString().trim();

  const supabase = await createClient();

  let query = supabase
    .from("profiles")
    .select("id, name, student_no, section, onboarded, role")
    .eq("role", "student")
    .order("student_no", { ascending: true });

  if (q) {
    // 이름이든 학번이든 한 칸으로 찾는다
    query = query.or(`name.ilike.%${q}%,student_no.ilike.%${q}%`);
  }

  const { data: students } = await query;
  const rows = students ?? [];

  return (
    <Page width="wide">
      <p className="mb-6">
        <Link href="/admin" className="text-sm text-accent underline">
          ← 관리자 홈
        </Link>
      </p>
      <h1 className="font-display text-2xl sm:text-3xl mb-2">학생 계정</h1>
      <p className="text-mute text-sm mb-8 leading-relaxed">
        첫 비밀번호는 <b>000000</b>(0 여섯 개)입니다. 학생이 처음 로그인하면 새 비밀번호를
        정하게 됩니다. 비밀번호를 잊은 학생은 아래 목록에서 <b>초기화</b>해주세요 —
        학번이 실제 메일 주소가 아니라 재설정 메일은 보낼 수 없습니다.
      </p>

      <section className="mb-14">
        <h2 className="text-sm font-medium mb-3">명단 붙여넣어 계정 만들기</h2>
        <BulkCreateForm />
      </section>

      <section>
        <div className="flex items-baseline justify-between gap-3 mb-3">
          <h2 className="text-sm font-medium">
            등록된 학생{" "}
            <span className="text-mute font-normal">
              {q ? `검색 ${rows.length}명` : `${rows.length}명`}
            </span>
          </h2>
        </div>

        <StudentSearch initialQuery={q} />

        {rows.length === 0 ? (
          <p className="text-mute text-sm">
            {q ? "조건에 맞는 학생이 없습니다." : "아직 등록된 학생이 없습니다."}
          </p>
        ) : (
          <div className="space-y-2">
            {rows.map((s) => (
              <div
                key={s.id}
                className="border border-line rounded-xl p-4 bg-white flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {s.name}
                    <span className="text-mute font-normal text-sm ml-2 tabular-nums">
                      {s.student_no}
                    </span>
                  </p>
                  <p className="text-xs text-mute mt-0.5">
                    {s.section ? `${s.section}분반` : "분반 미지정"} ·{" "}
                    {s.onboarded ? "비밀번호 설정함" : "첫 로그인 전 (000000)"}
                  </p>
                </div>
                <ResetPasswordButton profileId={s.id} name={s.name} />
              </div>
            ))}
          </div>
        )}
      </section>
    </Page>
  );
}
