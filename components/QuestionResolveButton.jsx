"use client";

import { useState, useTransition } from "react";
import { toggleQuestionResolved } from "@/app/actions/adminQuestions";

export default function QuestionResolveButton({ questionId, resolved }) {
  const [isResolved, setIsResolved] = useState(resolved);
  const [isPending, startTransition] = useTransition();

  const handle = () => {
    const next = !isResolved;
    setIsResolved(next); // 낙관적 반영 — 실패하면 아래에서 되돌린다
    startTransition(async () => {
      try {
        await toggleQuestionResolved(questionId, next);
      } catch (e) {
        setIsResolved(!next);
        alert(e.message ?? "변경에 실패했습니다.");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handle}
      disabled={isPending}
      aria-pressed={isResolved}
      className={`shrink-0 text-xs px-3 py-1.5 rounded border transition-colors disabled:opacity-50 ${
        isResolved
          ? "border-line text-mute"
          : "border-accent text-accent"
      }`}
    >
      {isResolved ? "처리함 · 되돌리기" : "처리함으로"}
    </button>
  );
}
