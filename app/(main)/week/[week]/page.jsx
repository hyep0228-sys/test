import { createClient } from "@/lib/supabase/server";
import WeekActivityGrid from "@/components/WeekActivityGrid";

export default async function WeekOverviewPage({ params }) {
  const { week: weekParam } = await params;
  const weekId = Number(weekParam);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: week }, { data: profile }] = await Promise.all([
    supabase.from("weeks").select("*").eq("id", weekId).maybeSingle(),
    supabase.from("profiles").select("role").eq("id", user?.id).maybeSingle(),
  ]);
  const isProfessor = profile?.role === "professor";

  if (!week) {
    return (
      <main className="px-6 py-16">
        <p className="text-mute">해당 주차를 찾을 수 없습니다.</p>
      </main>
    );
  }

  if (!week.is_open && !isProfessor) {
    return (
      <main className="px-6 py-16">
        <p className="text-sm text-mute mb-1">
          WEEK {String(week.id).padStart(2, "0")}
        </p>
        <h1 className="font-display text-3xl mb-6">{week.short_title}</h1>
        <p className="text-mute">아직 열리지 않은 주차입니다.</p>
      </main>
    );
  }

  const [{ data: completions }, { data: materialRows }] = await Promise.all([
    supabase
      .from("completions")
      .select("activity")
      .eq("user_id", user.id)
      .eq("week_id", week.id),
    supabase
      .from("lecture_materials")
      .select("image_url")
      .eq("week_id", week.id)
      .order("order_no", { ascending: true }),
  ]);
  const completedKeys = (completions ?? []).map((c) => c.activity);

  return (
    <main className="px-6 py-16">
      <WeekActivityGrid
        week={week}
        completedKeys={completedKeys}
        materials={materialRows ?? []}
      />
    </main>
  );
}
