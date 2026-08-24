"use client";

import { useActionState } from "react";
import { submitBalance } from "@/app/actions/balance";

const initialState = { error: null };

export default function BalanceForm({ weekId, questions, showReflection }) {
  const [state, formAction, isPending] = useActionState(
    submitBalance,
    initialState
  );

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="week_id" value={weekId} />

      {questions.map((q) => (
        <fieldset key={q.id} className="space-y-3">
          <input type="hidden" name="question_id" value={q.id} />
          <legend className="text-sm mb-2">{q.question}</legend>
          <div className="grid grid-cols-2 gap-3">
            <label className="border border-line rounded p-4 bg-white text-center cursor-pointer has-[:checked]:border-accent has-[:checked]:ring-1 has-[:checked]:ring-accent">
              <input
                type="radio"
                name={`choice-${q.id}`}
                value="A"
                required
                className="sr-only"
              />
              <span className="text-sm">{q.label_a}</span>
            </label>
            <label className="border border-line rounded p-4 bg-white text-center cursor-pointer has-[:checked]:border-accent has-[:checked]:ring-1 has-[:checked]:ring-accent">
              <input
                type="radio"
                name={`choice-${q.id}`}
                value="B"
                required
                className="sr-only"
              />
              <span className="text-sm">{q.label_b}</span>
            </label>
          </div>
        </fieldset>
      ))}

      {showReflection && (
        <div>
          <label className="block text-sm mb-2" htmlFor="reflection">
            15주 동안 당신이 선택한 경향을 돌아보며, 짧게 남겨보세요.
          </label>
          <textarea
            id="reflection"
            name="reflection"
            rows={4}
            className="w-full border border-line bg-white px-4 py-3 rounded"
          />
        </div>
      )}

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-accent text-white py-3 rounded font-medium disabled:opacity-60"
      >
        {isPending ? "저장 중..." : "제출"}
      </button>
    </form>
  );
}
