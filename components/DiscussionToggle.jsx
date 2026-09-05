"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleDiscussionOpen } from "@/app/actions/discussion";

/** 교수자 전용. 수업이 일찍 끝난 날 그 자리에서 논의를 연다. */
export default function DiscussionToggle({ weekId, open }) {
  const [isOpen, setIsOpen] = useState(open);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handle = () => {
    const next = !isOpen;
    setIsOpen(next);
    startTransition(async () => {
      try {
        await toggleDiscussionOpen(weekId, next);
        router.refresh();
      } catch (e) {
        setIsOpen(!next);
        alert(e.message ?? "변경에 실패했습니다.");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handle}
      disabled={isPending}
      aria-pressed={isOpen}
      className={`text-xs px-3 py-1.5 rounded border transition-colors disabled:opacity-50 ${
        isOpen ? "border-accent text-accent" : "border-line text-mute"
      }`}
    >
      {isOpen ? "논의 열림 · 닫기" : "팀 논의 열기"}
    </button>
  );
}
