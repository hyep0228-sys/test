import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function SlidesAdminPage() {
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

  const [{ data: weeks }, { data: overrides }] = await Promise.all([
    supabase
      .from("weeks")
      .select("id, short_title, is_exam")
      .order("id", { ascending: true }),
    supabase.from("slide_overrides").select("week_id"),
  ]);

  const editedCountByWeek = new Map();
  for (const o of overrides ?? []) {
    editedCountByWeek.set(o.week_id, (editedCountByWeek.get(o.week_id) ?? 0) + 1);
  }

  return (
    <main className="px-6 py-16 max-w-2xl mx-auto">
      <p className="mb-6">
        <Link href="/admin" className="text-sm text-accent underline">
          ← 관리자 홈
        </Link>
      </p>
      <h1 className="font-display text-3xl mb-2">슬라이드 편집</h1>
      <p className="text-mute mb-10 text-sm">
        여기서 고친 내용은 배포 없이 바로 학생 화면에 반영됩니다. 큰 폭의
        구조 변경(새 슬라이드 추가 등)은 여전히 코드로 반영해야 해요.
      </p>

      <div className="space-y-2">
        {(weeks ?? []).map((w) => (
          <Link
            key={w.id}
            href={`/admin/slides/${w.id}`}
            className="border border-line rounded p-4 bg-white flex justify-between items-center"
          >
            <div>
              <p className="text-sm text-mute">
                WEEK {String(w.id).padStart(2, "0")}
              </p>
              <p className="font-medium">{w.short_title}</p>
            </div>
            {w.is_exam ? (
              <span className="text-sm text-mute">시험</span>
            ) : editedCountByWeek.get(w.id) ? (
              <span className="text-sm text-accent">
                {editedCountByWeek.get(w.id)}개 수정됨
              </span>
            ) : null}
          </Link>
        ))}
      </div>
    </main>
  );
}
