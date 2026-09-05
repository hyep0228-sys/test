import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Page from "@/components/Page";
import DiscussionForm from "@/components/DiscussionForm";
import DiscussionBoard from "@/components/DiscussionBoard";
import DiscussionToggle from "@/components/DiscussionToggle";
import { groupByTeam, withImageUrls } from "@/lib/discussion";

export default async function DiscussionPage({ params }) {
  const { week: weekParam } = await params;
  const weekId = Number(weekParam);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: week }, { data: profile }, { data: posts }] =
    await Promise.all([
      supabase
        .from("weeks")
        .select("id, short_title, is_open, discussion_open")
        .eq("id", weekId)
        .maybeSingle(),
      supabase.from("profiles").select("role").eq("id", user?.id).maybeSingle(),
      supabase
        .from("discussion_posts")
        .select(
          "id, user_id, team_name, body, link_url, image_path, created_at, author_nickname",
        )
        .eq("week_id", weekId)
        .order("created_at", { ascending: true }),
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
        <p className="text-mute">아직 열리지 않은 주차입니다.</p>
      </Page>
    );
  }

  const rows = withImageUrls(supabase, posts ?? []);
  const teams = groupByTeam(rows);
  const teamNames = teams.map((t) => t.name);

  return (
    <Page width="wide">
      <p className="mb-6">
        <Link
          href={`/week/${weekId}`}
          className="text-sm text-accent underline"
        >
          ← {week.short_title}
        </Link>
      </p>

      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="min-w-0">
          <p className="text-sm text-mute mb-1">
            WEEK {String(week.id).padStart(2, "0")}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl">팀 논의</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0 pt-1">
          {teams.length > 0 && (
            <Link
              href={`/week/${weekId}/discussion/present`}
              className="text-xs px-3 py-1.5 rounded border border-line text-mute"
            >
              발표 모드
            </Link>
          )}
          {isProfessor && (
            <DiscussionToggle weekId={weekId} open={week.discussion_open} />
          )}
        </div>
      </div>

      <p className="text-mute text-sm mb-8">
        {teams.length > 0
          ? `${teams.length}개 조 · ${rows.length}개 글`
          : "아직 올라온 글이 없습니다."}
      </p>

      {week.discussion_open ? (
        <DiscussionForm weekId={weekId} teamNames={teamNames} />
      ) : (
        <p className="border border-line rounded-2xl p-5 text-sm text-mute mb-8">
          지금은 논의가 닫혀 있어 새 글을 올릴 수 없습니다.
          {isProfessor && " 위의 '팀 논의 열기'를 누르면 열립니다."}
        </p>
      )}

      {teams.length > 0 && (
        <DiscussionBoard
          teams={teams}
          currentUserId={user?.id}
          isProfessor={isProfessor}
        />
      )}
    </Page>
  );
}
