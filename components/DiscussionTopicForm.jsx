"use client";

import { useActionState } from "react";
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
        id="discussion-topic"
        name="topic"
        rows={6}
        maxLength={TOPIC_MAX_LENGTH}
        defaultValue={initialTopic ?? ""}
        placeholder="예: 만국박람회의 전시물 중 하나를 골라, 그것이 기계 생산의 무엇을 보여주는지 이야기해 보자."
        className="w-full border border-line bg-paper px-3 py-2 rounded text-sm leading-relaxed"
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
