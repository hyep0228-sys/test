"use client";

import { useState, useTransition } from "react";
import { resetStudentPassword } from "@/app/actions/adminStudents";

export default function ResetPasswordButton({ profileId, name }) {
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handle = () => {
    if (!confirm(`${name} 학생의 비밀번호를 000000 으로 되돌릴까요?\n다음 로그인에서 새 비밀번호를 정하게 됩니다.`)) return;
    startTransition(async () => {
      try {
        await resetStudentPassword(profileId);
        setDone(true);
      } catch (e) {
        alert(e.message ?? "초기화에 실패했습니다.");
      }
    });
  };

  if (done) return <span className="text-xs text-mute shrink-0">000000 으로 초기화됨</span>;

  return (
    <button
      type="button"
      onClick={handle}
      disabled={isPending}
      className="shrink-0 text-xs px-4 min-h-11 inline-flex items-center rounded border border-line text-mute disabled:opacity-50"
    >
      {isPending ? "초기화 중..." : "비밀번호 초기화"}
    </button>
  );
}
