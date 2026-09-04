import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Page from "@/components/Page";

function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

export default async function AdminPage() {
  const supabase = await createClient();

  // 질문 전체 목록과 필터는 /admin/questions 가 맡는다. 여기는 미처리 몇 건만 미리 보여준다.
  const [{ data: weeks }, { count: studentCount }, { count: unresolvedCount }, { data: recent }] =
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
        .select("id", { count: "exact", head: true })
        .is("resolved_at", null),
      supabase
        .from("lecture_questions")
        .select("id, week_id, page_no, question, created_at, profiles(nickname, section)")
        .is("resolved_at", null)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const weekTitleById = new Map((weeks ?? []).map((w) => [w.id, w.short_title]));
  const recentRows = recent ?? [];

  return (
    <Page width="wide">
      <h1 className="font-display text-2xl sm:text-3xl mb-2">관리자</h1>
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

      <div className="flex items-baseline justify-between gap-3 mb-3">
        <p className="text-sm font-medium">
          학생 질문{" "}
          <span className="text-mute font-normal">
            미처리 {unresolvedCount ?? 0}개
          </span>
        </p>
        <Link href="/admin/questions" className="text-sm text-accent shrink-0">
          전체 보기 →
        </Link>
      </div>

      {recentRows.length === 0 ? (
        <p className="text-mute text-sm mb-12">미처리 질문이 없습니다.</p>
      ) : (
        <div className="space-y-2 mb-12">
          {recentRows.map((q) => (
            <Link
              key={q.id}
              href={`/admin/questions?week=${q.week_id}`}
              className="block border border-line rounded-xl p-4 bg-white hover:border-ink transition-colors"
            >
              <div className="flex justify-between items-baseline gap-3 mb-1.5 text-xs text-mute">
                <span className="min-w-0 truncate">
                  WEEK {String(q.week_id).padStart(2, "0")} ·{" "}
                  {weekTitleById.get(q.week_id) ?? ""}
                  {q.page_no ? ` · ${q.page_no}페이지` : ""}
                </span>
                <span className="shrink-0">{formatDate(q.created_at)}</span>
              </div>
              <p className="text-sm">{q.question}</p>
              <p className="text-xs text-mute mt-1.5">
                {q.profiles?.nickname ?? "익명"} · {q.profiles?.section}분반
              </p>
            </Link>
          ))}
        </div>
      )}

      <p className="text-sm font-medium mb-3">주차</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {(weeks ?? []).map((w) => (
          <div
            key={w.id}
            className="border border-line rounded p-4 bg-white flex justify-between items-center"
          >
            <div className="min-w-0">
              <p className="text-sm text-mute">
                WEEK {String(w.id).padStart(2, "0")}
              </p>
              <p className="font-medium truncate">{w.short_title}</p>
            </div>
            <span className="text-sm text-mute shrink-0">
              {w.is_exam ? "시험" : w.is_open ? "열림" : "닫힘"}
            </span>
          </div>
        ))}
      </div>
    </Page>
  );
}
