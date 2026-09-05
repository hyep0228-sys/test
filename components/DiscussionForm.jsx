"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createDiscussionPost } from "@/app/actions/discussion";

const initialState = { created: false, error: null };

/**
 * 조 이름은 자유 입력이다. 조가 그날 자리대로 랜덤하게 묶여서 미리 정해둘 수가 없다.
 * 대신 이미 올라온 이름을 datalist 로 제안해, 같은 조원끼리 이름이 갈리는 걸 줄인다.
 */
export default function DiscussionForm({ weekId, teamNames }) {
  const [state, formAction, isPending] = useActionState(
    createDiscussionPost,
    initialState,
  );
  const formRef = useRef(null);
  const [fileName, setFileName] = useState(null);

  useEffect(() => {
    if (state?.created) {
      const team = formRef.current?.elements.team_name.value;
      formRef.current?.reset();
      // 조 이름은 남겨둔다 — 같은 조가 이어서 여러 개 올리는 경우가 많다.
      if (formRef.current && team)
        formRef.current.elements.team_name.value = team;
      setFileName(null);
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="border border-line rounded-2xl bg-white p-5 sm:p-6 mb-8"
    >
      <input type="hidden" name="week_id" value={weekId} />

      <div className="mb-4">
        <label className="block text-sm mb-1" htmlFor="team_name">
          조 이름
        </label>
        <input
          id="team_name"
          name="team_name"
          list="team-names"
          required
          maxLength={40}
          placeholder="예: 1조, 창가팀"
          className="w-full sm:w-64 border border-line bg-paper px-4 py-3 rounded"
        />
        <datalist id="team-names">
          {teamNames.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
      </div>

      <div className="mb-4">
        <label className="block text-sm mb-1" htmlFor="body">
          논의한 내용
        </label>
        <textarea
          id="body"
          name="body"
          rows={4}
          placeholder="조에서 나온 이야기를 적어주세요"
          className="w-full border border-line bg-paper px-4 py-3 rounded text-sm"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm mb-1" htmlFor="link_url">
          링크 <span className="text-mute">(선택)</span>
        </label>
        <input
          id="link_url"
          name="link_url"
          type="url"
          inputMode="url"
          placeholder="https://figma.com/..."
          className="w-full border border-line bg-paper px-4 py-3 rounded text-sm"
        />
      </div>

      <div className="mb-5">
        <span className="block text-sm mb-1">
          사진 <span className="text-mute">(선택 · 5MB 까지)</span>
        </span>
        <label className="inline-flex items-center gap-3 cursor-pointer">
          <span className="text-sm border border-line rounded px-4 py-2.5 bg-paper">
            사진 고르기
          </span>
          <span className="text-xs text-mute min-w-0 truncate">
            {fileName ?? "선택된 파일 없음"}
          </span>
          <input
            type="file"
            name="image"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
        </label>
      </div>

      {state?.error && (
        <p className="text-sm text-red-600 mb-3">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="bg-accent text-white px-5 py-3 rounded-2xl font-medium text-sm disabled:opacity-60"
      >
        {isPending ? "올리는 중..." : "올리기"}
      </button>
    </form>
  );
}
