import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getEditableStage } from "@/lib/slideStore";
import SlideEditorForm from "@/components/SlideEditorForm";

export default async function SlideEditorPage({ params }) {
  const { week: weekParam, index: indexParam } = await params;
  const weekId = Number(weekParam);
  const slideIndex = Number(indexParam);

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

  const { data: override } = await supabase
    .from("slide_overrides")
    .select("content_html, updated_at")
    .eq("week_id", weekId)
    .eq("slide_index", slideIndex)
    .maybeSingle();

  const stage = getEditableStage(weekId, slideIndex, override?.content_html);

  if (!stage) {
    return (
      <main className="px-6 py-16 max-w-md mx-auto">
        <p className="text-mute">존재하지 않는 슬라이드예요.</p>
      </main>
    );
  }

  return (
    <main className="px-6 py-16 max-w-3xl mx-auto">
      <p className="mb-6">
        <Link
          href={`/admin/slides/${weekId}`}
          className="text-sm text-accent underline"
        >
          ← {weekId}주차 슬라이드 목록
        </Link>
      </p>
      <p className="text-sm text-mute mb-1">
        WEEK {String(weekId).padStart(2, "0")} · {slideIndex}번째 · {stage.dates}
      </p>
      <h1 className="font-display text-2xl mb-8">{stage.title}</h1>

      <SlideEditorForm
        weekId={weekId}
        slideIndex={slideIndex}
        initialHtml={stage.editableHtml}
        hasOverride={Boolean(override)}
        updatedAt={override?.updated_at ?? null}
      />
    </main>
  );
}
