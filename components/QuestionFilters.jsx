"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

/**
 * 관리자 질문 목록의 필터. 상태를 URL 에 담아서 새로고침·뒤로가기·링크 공유가 그대로 된다.
 * 값이 기본값이면 파라미터를 아예 빼서 주소가 지저분해지지 않게 한다.
 */
const SELECT =
  "border border-line bg-white rounded px-3 py-2 text-sm w-full sm:w-auto";

export default function QuestionFilters({ weeks, defaults }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const set = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value === defaults[key]) params.delete(key);
    else params.set(key, value);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 mb-6">
      <select
        aria-label="상태"
        className={SELECT}
        value={searchParams.get("state") ?? defaults.state}
        onChange={(e) => set("state", e.target.value)}
      >
        <option value="unresolved">미처리</option>
        <option value="resolved">처리함</option>
        <option value="all">전체</option>
      </select>

      <select
        aria-label="주차"
        className={SELECT}
        value={searchParams.get("week") ?? defaults.week}
        onChange={(e) => set("week", e.target.value)}
      >
        <option value="all">모든 주차</option>
        {weeks.map((w) => (
          <option key={w.id} value={String(w.id)}>
            {String(w.id).padStart(2, "0")} {w.short_title}
          </option>
        ))}
      </select>

      <select
        aria-label="분반"
        className={SELECT}
        value={searchParams.get("section") ?? defaults.section}
        onChange={(e) => set("section", e.target.value)}
      >
        <option value="all">모든 분반</option>
        <option value="1">1분반</option>
        <option value="2">2분반</option>
        <option value="3">3분반</option>
      </select>
    </div>
  );
}
