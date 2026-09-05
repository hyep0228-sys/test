import { createClient } from "@/lib/supabase/server";
import Page from "@/components/Page";
import DiscussionPresenter from "@/components/DiscussionPresenter";
import { groupByTeam, withImageUrls } from "@/lib/discussion";

export default async function DiscussionPresentPage({ params }) {
  const { week: weekParam } = await params;
  const weekId = Number(weekParam);

  const supabase = await createClient();

  const [{ data: week }, { data: posts }] = await Promise.all([
    supabase
      .from("weeks")
      .select("id, short_title")
      .eq("id", weekId)
      .maybeSingle(),
    supabase
      .from("discussion_posts")
      .select(
        "id, team_name, body, link_url, image_path, created_at, author_nickname",
      )
      .eq("week_id", weekId)
      .order("created_at", { ascending: true }),
  ]);

  const teams = groupByTeam(withImageUrls(supabase, posts ?? []));

  if (teams.length === 0) {
    return (
      <Page>
        <p className="text-mute">아직 올라온 글이 없습니다.</p>
      </Page>
    );
  }

  return (
    <DiscussionPresenter
      weekId={weekId}
      weekTitle={week?.short_title ?? ""}
      teams={teams}
    />
  );
}
