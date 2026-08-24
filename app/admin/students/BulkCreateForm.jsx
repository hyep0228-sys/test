"use client";

import { useActionState } from "react";
import { bulkCreateStudents } from "@/app/actions/adminStudents";

const initialState = { results: null, error: null };

export default function BulkCreateForm() {
  const [state, formAction, isPending] = useActionState(
    bulkCreateStudents,
    initialState
  );

  return (
    <div>
      <form action={formAction} className="space-y-3">
        <textarea
          name="csv"
          rows={10}
          placeholder={"박지혜,20260001,07\n김민준,20260002,15"}
          className="w-full border border-line bg-white px-4 py-3 rounded text-sm font-mono"
        />
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
            결과 ({state.results.filter((r) => r.status === "생성됨").length}/
            {state.results.length} 성공)
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
