import { createClient } from "@/lib/supabase/server";
import WeekActivityGrid from "@/components/WeekActivityGrid";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: week } = await supabase
    .from("weeks")
    .select("*")
    .eq("is_open", true)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  let completedKeys = [];
  let materials = [];
  if (user && week) {
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
    completedKeys = (completions ?? []).map((c) => c.activity);
    materials = materialRows ?? [];
  }

  return (
    <main className="px-6 py-16">
      <p className="text-mute text-sm mb-10">오늘의 활동</p>

      {!week && <p className="text-mute">현재 열려 있는 주차가 없습니다.</p>}

      {week && (
        <WeekActivityGrid
          week={week}
          completedKeys={completedKeys}
          materials={materials}
        />
      )}
    </main>
  );
}
