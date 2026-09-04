import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getEditableStage } from "@/lib/slideStore";
import SlideEditorForm from "@/components/SlideEditorForm";
import Page from "@/components/Page";

export default async function SlideEditorPage({ params }) {
  const { week: weekParam, index: indexParam } = await params;
  const weekId = Number(weekParam);
  const slideIndex = Number(indexParam);

  const supabase = await createClient();
  const { data: override } = await supabase
    .from("slide_overrides")
    .select("content_html, updated_at")
    .eq("week_id", weekId)
    .eq("slide_index", slideIndex)
    .maybeSingle();

  const stage = getEditableStage(weekId, slideIndex, override?.content_html);

  if (!stage) {
    return (
      <Page>
        <p className="text-mute">존재하지 않는 슬라이드예요.</p>
      </Page>
    );
  }

  return (
    <Page width="wide">
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
    </Page>
  );
}
