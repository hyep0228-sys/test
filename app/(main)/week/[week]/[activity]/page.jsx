import { getActivity } from "@/lib/activities";
import Page from "@/components/Page";

export default async function WeekActivityPage({ params }) {
  const { week, activity: activityKey } = await params;
  const activity = getActivity(activityKey);

  return (
    <Page>
      <p className="text-sm text-mute mb-1">
        WEEK {String(week).padStart(2, "0")}
      </p>
      <h1 className="font-display text-2xl sm:text-3xl mb-6">
        {activity ? activity.label : activityKey}
      </h1>
      <p className="text-mute">이 활동은 다음 Phase에서 구현될 예정입니다.</p>
    </Page>
  );
}
