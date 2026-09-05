"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * 발표 모드 — 빔 프로젝터로 한 조씩 크게 띄운다.
 *
 * 사이드바가 있는 (main) 레이아웃 안에 있지만 화면 전체를 덮어서 가린다.
 * 교실 뒤에서도 읽혀야 하므로 본문 글씨를 평소보다 크게 잡았다.
 */
export default function DiscussionPresenter({ weekId, weekTitle, teams }) {
  const [index, setIndex] = useState(0);
  const router = useRouter();

  const total = teams.length;
  const team = teams[index];

  const go = useCallback(
    (delta) => setIndex((i) => Math.min(Math.max(i + delta, 0), total - 1)),
    [total],
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "Escape") {
        router.push(`/week/${weekId}/discussion`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, router, weekId]);

  if (!team) return null;

  return (
    <div className="fixed inset-0 z-50 bg-paper flex flex-col">
      <header className="flex items-baseline justify-between gap-4 px-6 sm:px-10 py-4 border-b border-line shrink-0">
        <p className="text-sm text-mute min-w-0 truncate">
          WEEK {String(weekId).padStart(2, "0")} · {weekTitle}
        </p>
        <button
          onClick={() => router.push(`/week/${weekId}/discussion`)}
          className="text-sm text-mute shrink-0"
        >
          나가기 (Esc)
        </button>
      </header>

      {/* min-h-full + justify-center: 내용이 짧으면 화면 가운데,
          길면 상자가 늘어나 중앙정렬이 저절로 풀리고 스크롤된다. */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-10 py-8 sm:py-12">
        <div className="min-h-full flex flex-col justify-center max-w-6xl mx-auto w-full">
          <h1 className="font-sans font-semibold text-4xl sm:text-6xl xl:text-7xl mb-8 sm:mb-12">
            {team.name}
          </h1>

          <div className="space-y-8 sm:space-y-12">
            {team.posts.map((p) => (
              <div key={p.id}>
                {p.body && (
                  <p className="text-xl sm:text-3xl xl:text-4xl leading-relaxed whitespace-pre-wrap">
                    {p.body}
                  </p>
                )}
                {p.link_url && (
                  <a
                    href={p.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-4 text-lg sm:text-2xl xl:text-3xl text-accent underline break-all"
                  >
                    {p.link_url}
                  </a>
                )}
                {p.imageUrl && (
                  <img
                    src={p.imageUrl}
                    alt=""
                    className="mt-6 w-full max-h-[60vh] object-contain rounded-lg border border-line bg-white"
                  />
                )}
                <p className="text-sm xl:text-base text-mute mt-4">
                  {p.author_nickname ?? "익명"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="flex items-center justify-between gap-4 px-6 sm:px-10 py-4 border-t border-line shrink-0">
        <button
          onClick={() => go(-1)}
          disabled={index === 0}
          className="text-base px-5 py-2.5 rounded border border-line disabled:opacity-30"
          aria-label="이전 조"
        >
          ←
        </button>
        <p className="text-sm text-mute tabular-nums">
          {index + 1} / {total}
        </p>
        <button
          onClick={() => go(1)}
          disabled={index === total - 1}
          className="text-base px-5 py-2.5 rounded border border-line disabled:opacity-30"
          aria-label="다음 조"
        >
          →
        </button>
      </footer>
    </div>
  );
}
