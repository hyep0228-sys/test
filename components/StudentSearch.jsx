"use client";

import { useRouter, usePathname } from "next/navigation";

/** 이름·학번 한 칸 검색. 상태를 URL 에 담아 새로고침과 뒤로가기가 그대로 되게 한다. */
export default function StudentSearch({ initialQuery }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <form
      className="flex gap-2 mb-4"
      action={(formData) => {
        const q = formData.get("q")?.toString().trim() ?? "";
        router.push(q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname);
      }}
    >
      <input
        name="q"
        defaultValue={initialQuery}
        placeholder="이름 또는 학번"
        className="flex-1 sm:flex-none sm:w-64 border border-line bg-white px-4 py-2.5 rounded text-sm"
      />
      <button
        type="submit"
        className="text-sm px-4 min-h-11 rounded border border-line text-mute"
      >
        찾기
      </button>
    </form>
  );
}
