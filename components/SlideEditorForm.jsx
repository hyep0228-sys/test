"use client";

import { useActionState, useState } from "react";
import {
  saveSlideOverride,
  resetSlideOverride,
} from "@/app/actions/slideOverrides";

const initialState = { saved: false, error: null };

function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(
    2,
    "0"
  )}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function SlideEditorForm({
  weekId,
  slideIndex,
  initialHtml,
  hasOverride,
  updatedAt,
}) {
  const [saveState, saveAction, saveIsPending] = useActionState(
    saveSlideOverride,
    initialState
  );
  const [resetState, resetAction, resetIsPending] = useActionState(
    resetSlideOverride,
    initialState
  );
  const [previewNonce, setPreviewNonce] = useState(0);
  const [text, setText] = useState(initialHtml);

  const busy = saveIsPending || resetIsPending;
  const savedJustNow = saveState.saved || resetState.saved;

  return (
    <div>
      <form
        action={async (formData) => {
          await saveAction(formData);
          setPreviewNonce((n) => n + 1);
        }}
      >
        <input type="hidden" name="week_id" value={weekId} />
        <input type="hidden" name="slide_index" value={slideIndex} />
        <textarea
          name="content_html"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={16}
          spellCheck={false}
          className="w-full border border-line bg-white px-3 py-3 rounded text-sm font-mono leading-relaxed"
        />
        <p className="text-xs text-mute mt-2">
          문장·단어만 고치세요. 태그(&lt;...&gt;)와{" "}
          <code className="bg-line/40 px-1 rounded">{"{{IMG_1}}"}</code> 같은
          자리표시자는 지우거나 옮기지 마세요 — 실제 이미지가 그 자리에
          그대로 들어갑니다.
        </p>

        <div className="flex items-center gap-3 mt-4">
          <button
            type="submit"
            disabled={busy}
            className="bg-accent text-white text-sm px-5 py-2 rounded disabled:opacity-60"
          >
            {saveIsPending ? "저장 중..." : "저장"}
          </button>
          {saveState.error && (
            <span className="text-xs text-red-600">{saveState.error}</span>
          )}
          {saveState.saved && (
            <span className="text-xs text-mute">저장됨 · 바로 반영됩니다</span>
          )}
        </div>
      </form>

      {hasOverride && (
        <form
          action={async (formData) => {
            await resetAction(formData);
            setPreviewNonce((n) => n + 1);
          }}
          className="mt-3"
        >
          <input type="hidden" name="week_id" value={weekId} />
          <input type="hidden" name="slide_index" value={slideIndex} />
          <button
            type="submit"
            disabled={busy}
            className="text-xs text-mute underline disabled:opacity-60"
          >
            {resetIsPending ? "되돌리는 중..." : "원본으로 되돌리기"}
          </button>
          {updatedAt && (
            <span className="text-xs text-mute ml-3">
              마지막 수정 {formatDate(updatedAt)}
            </span>
          )}
        </form>
      )}

      <div className="mt-10">
        <p className="text-sm font-medium mb-2">
          미리보기 {savedJustNow ? "(저장된 상태)" : "(마지막 저장 상태)"}
        </p>
        <div className="border border-line rounded overflow-hidden bg-white aspect-video">
          <iframe
            key={previewNonce}
            src={`/slides/index.html?week=${weekId}&p=${slideIndex - 1}&clean=1`}
            title="미리보기"
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
}
