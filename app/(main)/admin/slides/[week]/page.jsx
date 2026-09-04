import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listSlidesForWeek } from "@/lib/slideStore";
import Page from "@/components/Page";

export default async function WeekSlidesAdminPage({ params }) {
  const { week: weekParam } = await params;
  const weekId = Number(weekParam);

  const supabase = await createClient();
  const [{ data: week }, { data: overrides }] = await Promise.all([
    supabase.from("weeks").select("*").eq("id", weekId).maybeSingle(),
    supabase
      .from("slide_overrides")
      .select("slide_index, updated_at")
      .eq("week_id", weekId),
  ]);

  const overrideByIndex = new Map(
    (overrides ?? []).map((o) => [o.slide_index, o.updated_at])
  );
  const slides = listSlidesForWeek(weekId);

  return (
    <Page width="wide">
      <p className="mb-6">
        <Link href="/admin/slides" className="text-sm text-accent underline">
          ← 주차 목록
        </Link>
      </p>
      <p className="text-sm text-mute mb-1">WEEK {String(weekId).padStart(2, "0")}</p>
      <h1 className="font-display text-2xl sm:text-3xl mb-10">
        {week?.short_title ?? ""}
      </h1>

      {slides.length === 0 ? (
        <p className="text-mute text-sm">
          이 주차는 슬라이드 편집 대상이 아니에요 (시험 주간 등).
        </p>
      ) : (
        <div className="space-y-2">
          {slides.map((s) => (
            <Link
              key={s.index}
              href={`/admin/slides/${weekId}/${s.index}`}
              className="border border-line rounded p-4 bg-white flex justify-between items-center"
            >
              <div>
                <p className="text-sm text-mute">{s.index}. {s.dates}</p>
                <p className="font-medium">{s.title}</p>
              </div>
              {overrideByIndex.has(s.index) && (
                <span className="text-sm text-accent shrink-0">수정됨</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </Page>
  );
}
