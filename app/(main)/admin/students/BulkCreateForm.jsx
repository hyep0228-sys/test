"use client";

import { useActionState } from "react";
import { bulkCreateStudents } from "@/app/actions/adminStudents";

const initialState = { results: null, error: null };

export default function BulkCreateForm() {
  const [state, formAction, isPending] = useActionState(
    bulkCreateStudents,
    initialState
  );
  const ok = state?.results?.filter((r) => r.status === "생성됨").length ?? 0;

  return (
    <div>
      <form action={formAction} className="space-y-4">
        <div>
          <label className="block text-sm mb-1" htmlFor="section">
            분반
          </label>
          <select
            id="section"
            name="section"
            required
            defaultValue=""
            className="border border-line bg-white rounded px-3 py-2.5 text-sm"
          >
            <option value="" disabled>
              고르세요
            </option>
            <option value="1">1분반</option>
            <option value="2">2분반</option>
            <option value="3">3분반</option>
          </select>
          <p className="text-mute text-xs mt-1.5">
            이 목록 전체에 같은 분반이 들어갑니다. 분반별로 나눠서 붙여넣으세요.
          </p>
        </div>

        <div>
          <label className="block text-sm mb-1" htmlFor="csv">
            명단 <span className="text-mute">(한 줄에 <b>이름,학번</b>)</span>
          </label>
          <textarea
            id="csv"
            name="csv"
            rows={10}
            placeholder={"박지혜,20260001\n김민준,20260002"}
            className="w-full border border-line bg-white px-4 py-3 rounded text-sm font-mono"
          />
          <p className="text-mute text-xs mt-1.5">
            엑셀에서 이름·학번 두 열을 그대로 복사해 붙여넣어도 됩니다.
          </p>
        </div>

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="bg-accent text-white text-sm px-5 py-2.5 rounded disabled:opacity-60"
        >
          {isPending ? "생성 중..." : "계정 생성"}
        </button>
      </form>

      {state?.results && (
        <div className="mt-8 space-y-2">
          <p className="text-sm font-medium">
            결과 ({ok}/{state.results.length} 성공)
          </p>
          {state.results.map((r, i) => (
            <div
              key={i}
              className={`border rounded p-3 text-xs ${
                r.status === "생성됨"
                  ? "border-line bg-white"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <p className="font-mono">{r.line}</p>
              <p
                className={
                  r.status === "생성됨" ? "text-accent mt-1" : "text-red-600 mt-1"
                }
              >
                {r.status} — {r.detail}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
