import { createClient } from "@/lib/supabase/server";
import WeekActivityGrid from "@/components/WeekActivityGrid";
import Page from "@/components/Page";

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
      <Page>
        <p className="text-mute">해당 주차를 찾을 수 없습니다.</p>
      </Page>
    );
  }

  if (!week.is_open && !isProfessor) {
    return (
      <Page>
        <p className="text-sm text-mute mb-1">
          WEEK {String(week.id).padStart(2, "0")}
        </p>
        <h1 className="font-display text-2xl sm:text-3xl mb-6">{week.short_title}</h1>
        <p className="text-mute">아직 열리지 않은 주차입니다.</p>
      </Page>
    );
  }

  const [
    { data: completions },
    { data: noteRow },
    { data: questionRows },
    { count: discussionCount },
  ] = await Promise.all([
      supabase
        .from("completions")
        .select("activity")
        .eq("user_id", user.id)
        .eq("week_id", week.id),
      supabase
        .from("lecture_notes")
        .select("text")
        .eq("user_id", user.id)
        .eq("week_id", week.id)
        .maybeSingle(),
      supabase
        .from("lecture_questions")
        .select("id, page_no, question")
        .eq("user_id", user.id)
        .eq("week_id", week.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("discussion_posts")
        .select("id", { count: "exact", head: true })
        .eq("week_id", week.id),
    ]);
  const completedKeys = (completions ?? []).map((c) => c.activity);

  return (
    <Page>
      <WeekActivityGrid
        week={week}
        completedKeys={completedKeys}
        note={noteRow?.text ?? ""}
        questions={questionRows ?? []}
        discussionCount={discussionCount ?? 0}
        isProfessor={isProfessor}
      />
    </Page>
  );
}
