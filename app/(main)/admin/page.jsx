import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

export default async function AdminPage() {
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
    return (
      <main className="px-6 py-16 max-w-md mx-auto">
        <p className="text-mute">교수자만 접근할 수 있습니다.</p>
      </main>
    );
  }

  const [{ data: weeks }, { count: studentCount }, { data: questions }] =
    await Promise.all([
      supabase
        .from("weeks")
        .select("id, short_title, is_open, is_exam")
        .order("id", { ascending: true }),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "student"),
      supabase
        .from("lecture_questions")
        .select(
          "id, week_id, page_no, question, created_at, profiles(name, nickname, section)"
        )
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

  const weekTitleById = new Map((weeks ?? []).map((w) => [w.id, w.short_title]));

  return (
    <main className="px-6 py-16 max-w-2xl mx-auto">
      <h1 className="font-display text-3xl mb-2">관리자</h1>
      <p className="text-mute mb-4">전체 학생 수: {studentCount ?? 0}명</p>
      <p className="mb-2">
        <Link href="/admin/students" className="text-sm text-accent underline">
          학생 계정 일괄 생성 →
        </Link>
      </p>
      <p className="mb-10">
        <Link href="/admin/slides" className="text-sm text-accent underline">
          슬라이드 편집 →
        </Link>
      </p>

      <p className="text-sm font-medium mb-3">주차</p>
      <div className="space-y-2 mb-12">
        {(weeks ?? []).map((w) => (
          <div
            key={w.id}
            className="border border-line rounded p-4 bg-white flex justify-between items-center"
          >
            <div>
              <p className="text-sm text-mute">
                WEEK {String(w.id).padStart(2, "0")}
              </p>
              <p className="font-medium">{w.short_title}</p>
            </div>
            <span className="text-sm text-mute">
              {w.is_exam ? "시험" : w.is_open ? "열림" : "닫힘"}
            </span>
          </div>
        ))}
      </div>

      <p className="text-sm font-medium mb-3">
        학생 질문 {questions?.length ? `(${questions.length})` : ""}
      </p>
      {(questions ?? []).length === 0 ? (
        <p className="text-mute text-sm">아직 등록된 질문이 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {questions.map((q) => (
            <div key={q.id} className="border border-line rounded p-4 bg-white">
              <div className="flex justify-between items-baseline mb-1.5 text-xs text-mute">
                <span>
                  WEEK {String(q.week_id).padStart(2, "0")} ·{" "}
                  {weekTitleById.get(q.week_id) ?? ""}
                  {q.page_no ? ` · ${q.page_no}페이지` : ""}
                </span>
                <span>{formatDate(q.created_at)}</span>
              </div>
              <p className="text-sm">{q.question}</p>
              <p className="text-xs text-mute mt-1.5">
                {q.profiles?.nickname ?? "익명"} · {q.profiles?.section}분반
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
