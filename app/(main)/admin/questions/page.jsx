import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Page from "@/components/Page";
import QuestionFilters from "@/components/QuestionFilters";
import QuestionResolveButton from "@/components/QuestionResolveButton";

// 필터를 걸면 대개 몇십 건이다. 상한에 걸리면 화면에서 알려주고 필터를 권한다.
const MAX_ROWS = 300;

const DEFAULTS = { state: "unresolved", week: "all", section: "all" };

function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

export default async function AdminQuestionsPage({ searchParams }) {
  const sp = await searchParams;
  const state = sp?.state ?? DEFAULTS.state;
  const week = sp?.week ?? DEFAULTS.week;
  const section = sp?.section ?? DEFAULTS.section;

  const supabase = await createClient();

  // 분반은 profiles 쪽 컬럼이라 !inner 로 조인해야 걸러진다.
  let query = supabase
    .from("lecture_questions")
    .select(
      "id, week_id, page_no, question, created_at, resolved_at, profiles!inner(name, nickname, section)"
    )
    .order("created_at", { ascending: false })
    .limit(MAX_ROWS);

  if (state === "unresolved") query = query.is("resolved_at", null);
  else if (state === "resolved") query = query.not("resolved_at", "is", null);
  if (week !== "all") query = query.eq("week_id", Number(week));
  if (section !== "all") query = query.eq("profiles.section", Number(section));

  const [{ data: weeks }, { data: questions }, { count: unresolvedCount }] =
    await Promise.all([
      supabase
        .from("weeks")
        .select("id, short_title")
        .order("id", { ascending: true }),
      query,
      supabase
        .from("lecture_questions")
        .select("id", { count: "exact", head: true })
        .is("resolved_at", null),
    ]);

  const weekTitleById = new Map((weeks ?? []).map((w) => [w.id, w.short_title]));
  const rows = questions ?? [];

  return (
    <Page width="wide">
      <p className="mb-6">
        <Link href="/admin" className="text-sm text-accent underline">
          ← 관리자 홈
        </Link>
      </p>
      <h1 className="font-display text-2xl sm:text-3xl mb-1">학생 질문</h1>
      <p className="text-mute text-sm mb-6">
        미처리 {unresolvedCount ?? 0}개 · 이 목록 {rows.length}개
      </p>

      <QuestionFilters weeks={weeks ?? []} defaults={DEFAULTS} />

      {rows.length === 0 ? (
        <p className="text-mute text-sm">조건에 맞는 질문이 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((q) => (
            <div
              key={q.id}
              className={`border rounded-xl p-4 ${
                q.resolved_at ? "border-line bg-transparent" : "border-line bg-white"
              }`}
            >
              <div className="flex justify-between items-baseline gap-3 mb-1.5 text-xs text-mute">
                <span className="min-w-0 truncate">
                  WEEK {String(q.week_id).padStart(2, "0")} ·{" "}
                  {weekTitleById.get(q.week_id) ?? ""}
                  {q.page_no ? ` · ${q.page_no}페이지` : ""}
                </span>
                <span className="shrink-0">{formatDate(q.created_at)}</span>
              </div>

              <p className={`text-sm ${q.resolved_at ? "text-mute" : ""}`}>
                {q.question}
              </p>

              <div className="flex items-center justify-between gap-3 mt-3">
                <p className="text-xs text-mute min-w-0 truncate">
                  {q.profiles?.name ?? "이름 없음"}
                  {q.profiles?.nickname ? ` (${q.profiles.nickname})` : ""} ·{" "}
                  {q.profiles?.section}분반
                </p>
                <QuestionResolveButton
                  questionId={q.id}
                  resolved={Boolean(q.resolved_at)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {rows.length === MAX_ROWS && (
        <p className="text-mute text-xs mt-4">
          {MAX_ROWS}개까지만 보여줍니다. 주차나 분반으로 좁혀보세요.
        </p>
      )}
    </Page>
  );
}
