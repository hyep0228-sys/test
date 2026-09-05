import { createClient } from "@/lib/supabase/server";
import Page from "@/components/Page";
import WeekTimeline from "@/components/WeekTimeline";
import NoticeCard from "@/components/NoticeCard";
import { ACTIVITIES } from "@/lib/activities";
import { NOTICE_KEY } from "@/lib/notice";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: weeks }, { data: profile }, { data: noticeRow }] =
    await Promise.all([
      supabase
        .from("weeks")
        .select("id, short_title, is_open, is_exam")
        .order("id", { ascending: true }),
      supabase.from("profiles").select("role").eq("id", user?.id).maybeSingle(),
      supabase
        .from("app_settings")
        .select("value")
        .eq("key", NOTICE_KEY)
        .maybeSingle(),
    ]);

  const notice = noticeRow?.value?.text?.trim() ? noticeRow.value : null;

  const isProfessor = profile?.role === "professor";
  const list = weeks ?? [];

  // "이번 주"는 열려 있는 주차 중 가장 나중 것. 교수자가 토글로 주차를 열면
  // 그 주가 이번 주가 된다 — 날짜가 아니라 교수자의 공개 시점이 기준이다.
  const currentWeekId =
    [...list].reverse().find((w) => w.is_open && !w.is_exam)?.id ?? null;

  // 한 주차의 활동을 다 마치면 완료. 지금 ACTIVITIES 는 QUIZ 하나뿐이다.
  let completedWeekIds = [];
  if (user) {
    const { data: completions } = await supabase
      .from("completions")
      .select("week_id, activity")
      .eq("user_id", user.id);

    const byWeek = new Map();
    for (const c of completions ?? []) {
      if (!byWeek.has(c.week_id)) byWeek.set(c.week_id, new Set());
      byWeek.get(c.week_id).add(c.activity);
    }
    completedWeekIds = [...byWeek.entries()]
      .filter(([, keys]) => ACTIVITIES.every((a) => keys.has(a.key)))
      .map(([weekId]) => weekId);
  }

  const openCount = list.filter((w) => w.is_open && !w.is_exam).length;

  return (
    <Page>
      <h1 className="font-display text-3xl sm:text-4xl mb-1">디자인사</h1>
      <p className="text-mute mb-8 sm:mb-10 text-sm">
        15주 · 열린 주차 {openCount}개 · 완료 {completedWeekIds.length}개
      </p>

      {notice && (
        <NoticeCard text={notice.text} updatedAt={notice.updated_at} />
      )}

      {list.length === 0 ? (
        <p className="text-mute">주차 정보를 불러오지 못했습니다.</p>
      ) : (
        <WeekTimeline
          weeks={list}
          currentWeekId={currentWeekId}
          completedWeekIds={completedWeekIds}
          isProfessor={isProfessor}
        />
      )}
    </Page>
  );
}
