import { getActivity } from "@/lib/activities";

export default async function WeekActivityPage({ params }) {
  const { week, activity: activityKey } = await params;
  const activity = getActivity(activityKey);

  return (
    <main className="px-6 py-16">
      <p className="text-sm text-mute mb-1">
        WEEK {String(week).padStart(2, "0")}
      </p>
      <h1 className="font-display text-3xl mb-6">
        {activity ? activity.label : activityKey}
      </h1>
      <p className="text-mute">이 활동은 다음 Phase에서 구현될 예정입니다.</p>
    </main>
  );
}
