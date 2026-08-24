import { createClient } from "@/lib/supabase/server";

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

  const { data: weeks } = await supabase
    .from("weeks")
    .select("id, short_title, is_open, is_exam")
    .order("id", { ascending: true });

  const { count: studentCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "student");

  return (
    <main className="px-6 py-16 max-w-2xl mx-auto">
      <h1 className="font-display text-3xl mb-2">관리자</h1>
      <p className="text-mute mb-10">전체 학생 수: {studentCount ?? 0}명</p>

      <div className="space-y-2">
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
    </main>
  );
}
