"use client";

import { useActionState } from "react";
import { saveNotice } from "@/app/actions/notice";
import { NOTICE_MAX_LENGTH } from "@/lib/notice";

const initialState = { saved: false, cleared: false, error: null };

/** 교수자가 공지를 쓰고 지우는 칸. 내용을 비우고 저장하면 학생 화면에서 사라진다. */
export default function NoticeForm({ initialText }) {
  const [state, formAction, isPending] = useActionState(
    saveNotice,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="border border-line rounded-xl bg-white p-4 mb-10"
    >
      <label className="block text-sm font-medium mb-1" htmlFor="notice-text">
        공지
      </label>
      <p className="text-mute text-xs mb-3">
        홈 맨 위에 뜹니다. 비우고 저장하면 사라집니다.
      </p>
      <textarea
        id="notice-text"
        name="text"
        rows={3}
        maxLength={NOTICE_MAX_LENGTH}
        defaultValue={initialText}
        placeholder="예: 다음 주는 휴강입니다."
        className="w-full border border-line bg-paper px-3 py-2 rounded text-sm"
      />
      <div className="flex items-center gap-3 mt-3">
        <button
          type="submit"
          disabled={isPending}
          className="bg-accent text-white text-sm px-4 py-2 rounded disabled:opacity-60"
        >
          {isPending ? "저장 중..." : "저장"}
        </button>
        {state?.saved && (
          <span className="text-xs text-mute">
            {state.cleared ? "공지를 내렸습니다" : "저장됨"}
          </span>
        )}
        {state?.error && (
          <span className="text-xs text-red-600">{state.error}</span>
        )}
      </div>
    </form>
  );
}
