"use client";

import { useState, useEffect, useCallback } from "react";

export default function LectureMaterialButton({ materials }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const close = useCallback(() => setOpen(false), []);
  const goPrev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);
  const goNext = useCallback(
    () => setIndex((i) => Math.min(i + 1, materials.length - 1)),
    [materials.length]
  );

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, goNext, goPrev]);

  return (
    <>
      <button
        onClick={() => {
          setIndex(0);
          setOpen(true);
        }}
        className="w-full border border-line rounded p-3 text-sm text-center bg-white mb-6"
      >
        수업자료 다시보기
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={close}
        >
          <div
            className="bg-paper rounded-lg w-full max-w-3xl h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-line shrink-0">
              <p className="text-sm text-mute">
                {materials.length > 0
                  ? `${index + 1} / ${materials.length}`
                  : "수업자료"}
              </p>
              <button
                onClick={close}
                aria-label="닫기"
                className="text-mute text-lg leading-none px-1"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center overflow-auto p-4">
              {materials.length === 0 ? (
                <p className="text-mute text-sm">
                  아직 등록된 수업자료가 없습니다.
                </p>
              ) : (
                <img
                  src={materials[index].image_url}
                  alt={`수업자료 ${index + 1}페이지`}
                  className="max-h-full max-w-full object-contain"
                />
              )}
            </div>

            {materials.length > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-line shrink-0">
                <button
                  onClick={goPrev}
                  disabled={index === 0}
                  className="text-sm px-3 py-1.5 border border-line rounded disabled:opacity-30"
                >
                  ← 이전
                </button>
                <button
                  onClick={goNext}
                  disabled={index === materials.length - 1}
                  className="text-sm px-3 py-1.5 border border-line rounded disabled:opacity-30"
                >
                  다음 →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
