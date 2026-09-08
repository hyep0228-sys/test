"use client";

import { useActionState, useCallback, useEffect, useRef } from "react";
import { saveDiscussionTopic } from "@/app/actions/discussion";
import { TOPIC_MAX_LENGTH } from "@/lib/discussion";

const initialState = { saved: false, cleared: false, error: null };

/**
 * 교수자가 그 주차의 논의 주제를 쓰는 칸. 학생에게는 카드로만 보인다.
 * 논의를 열기 전에도 미리 써 둘 수 있게 열림 여부와 상관없이 나온다.
 */
export default function DiscussionTopicForm({ weekId, initialTopic }) {
  const [state, formAction, isPending] = useActionState(
    saveDiscussionTopic,
    initialState,
  );
  const textareaRef = useRef(null);

  // 주제를 길게 쓰면 고정 높이 칸 안에서 스크롤돼 전체가 한눈에 안 들어온다.
  // 내용만큼 칸을 늘려 스크롤을 없앤다. 폭이 바뀌면 줄바꿈이 달라지므로 다시 잰다.
  const fitHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    fitHeight();
    window.addEventListener("resize", fitHeight);
    return () => window.removeEventListener("resize", fitHeight);
  }, [fitHeight]);

  // 저장하고 나면 서버가 화면을 다시 그린다. 그때 높이도 다시 맞춘다.
  useEffect(() => {
    if (state?.saved) fitHeight();
  }, [state, fitHeight]);

  return (
    <form
      action={formAction}
      className="border border-line border-l-2 border-l-accent rounded-2xl bg-white p-5 sm:p-6 mb-8"
    >
      <input type="hidden" name="week_id" value={weekId} />
      <label
        className="block text-[11px] tracking-wide text-accent mb-1.5"
        htmlFor="discussion-topic"
      >
        논의 주제
      </label>
      <p className="text-mute text-xs mb-3">
        학생 화면과 발표 모드에 함께 뜹니다. 비우고 저장하면 사라집니다.
      </p>
      <textarea
        ref={textareaRef}
        id="discussion-topic"
        name="topic"
        rows={3}
        maxLength={TOPIC_MAX_LENGTH}
        defaultValue={initialTopic ?? ""}
        onInput={fitHeight}
        placeholder="예: 만국박람회의 전시물 중 하나를 골라, 그것이 기계 생산의 무엇을 보여주는지 이야기해 보자."
        className="w-full border border-line bg-paper px-3 py-2 rounded text-sm leading-relaxed resize-none overflow-hidden"
      />
      <div className="flex items-center gap-3 mt-3">
        <button
          type="submit"
          disabled={isPending}
          className="bg-accent text-white text-sm px-4 min-h-11 rounded disabled:opacity-60"
        >
          {isPending ? "저장 중..." : "저장"}
        </button>
        {state?.saved && (
          <span className="text-xs text-mute">
            {state.cleared ? "주제를 내렸습니다" : "저장됨"}
          </span>
        )}
        {state?.error && (
          <span className="text-xs text-red-600">{state.error}</span>
        )}
      </div>
    </form>
  );
}
