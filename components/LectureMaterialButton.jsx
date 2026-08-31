"use client";

import { useState, useEffect, useCallback, useRef, useActionState } from "react";
import { saveLectureNote, submitLectureQuestion } from "@/app/actions/lectureNotes";

const noteInitialState = { saved: false, error: null };
const questionInitialState = { submitted: null, error: null };

export default function LectureMaterialButton({
  weekId,
  initialNote,
  initialQuestions,
}) {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState(null); // null | "note" | "question"
  const [page, setPage] = useState(null);
  const [pageCount, setPageCount] = useState(null);
  const [questions, setQuestions] = useState(initialQuestions ?? []);
  const questionFormRef = useRef(null);

  const [noteState, noteAction, noteIsPending] = useActionState(
    saveLectureNote,
    noteInitialState
  );
  const [questionState, questionAction, questionIsPending] = useActionState(
    submitLectureQuestion,
    questionInitialState
  );

  useEffect(() => {
    if (questionState?.submitted) {
      setQuestions((prev) => [questionState.submitted, ...prev]);
      questionFormRef.current?.reset();
    }
  }, [questionState]);

  // The slide deck (served same-origin from /slides/index.html) posts its
  // current position on every slide change so this modal can show a page
  // count and attach page numbers to notes/questions.
  useEffect(() => {
    function onMessage(e) {
      const data = e.data;
      if (!data || data.source !== "design-history-deck") return;
      if (Number(data.week) !== Number(weekId)) return;
      if (data.page != null) setPage(data.page);
      if (data.pageCount != null) setPageCount(data.pageCount);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [weekId]);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const src = `/slides/index.html?week=${weekId}`;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full border border-line rounded-2xl py-10 px-6 text-base font-medium text-center bg-white mb-6"
      >
        LESSON
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={close}
        >
          <div
            className="bg-paper rounded-lg w-[96vw] max-w-6xl h-[92vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-line shrink-0">
              <p className="text-sm text-mute">
                {pageCount ? `${page ?? 1} / ${pageCount}` : "수업자료"}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPanel(panel === "note" ? null : "note")}
                  className={`text-xs px-3 py-1.5 rounded border ${
                    panel === "note"
                      ? "border-accent text-accent"
                      : "border-line text-mute"
                  }`}
                >
                  메모하기
                </button>
                <button
                  onClick={() =>
                    setPanel(panel === "question" ? null : "question")
                  }
                  className={`text-xs px-3 py-1.5 rounded border ${
                    panel === "question"
                      ? "border-accent text-accent"
                      : "border-line text-mute"
                  }`}
                >
                  질문남기기
                </button>
                <button
                  onClick={close}
                  aria-label="닫기"
                  className="text-mute text-lg leading-none px-1"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 flex min-h-0">
              <iframe
                src={src}
                title={`${weekId}주차 수업자료`}
                className="flex-1 border-0"
              />

              {panel && (
                <div className="w-80 shrink-0 border-l border-line overflow-y-auto p-4">
                  {panel === "note" && (
                    <form action={noteAction} className="flex flex-col h-full">
                      <input type="hidden" name="week_id" value={weekId} />
                      <p className="text-sm font-medium mb-2">나만의 메모</p>
                      <p className="text-xs text-mute mb-3">
                        이 주차 수업자료를 보며 남긴 메모는 나만 볼 수 있어요.
                      </p>
                      <textarea
                        name="text"
                        defaultValue={initialNote ?? ""}
                        rows={12}
                        className="w-full border border-line bg-white px-3 py-2 rounded text-sm flex-1"
                        placeholder="자유롭게 메모해보세요"
                      />
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          type="submit"
                          disabled={noteIsPending}
                          className="bg-accent text-white text-sm px-4 py-2 rounded disabled:opacity-60"
                        >
                          {noteIsPending ? "저장 중..." : "저장"}
                        </button>
                        {noteState?.saved && (
                          <span className="text-xs text-mute">저장됨</span>
                        )}
                        {noteState?.error && (
                          <span className="text-xs text-red-600">
                            {noteState.error}
                          </span>
                        )}
                      </div>
                    </form>
                  )}

                  {panel === "question" && (
                    <div className="flex flex-col h-full">
                      <p className="text-sm font-medium mb-2">질문남기기</p>
                      <p className="text-xs text-mute mb-3">
                        남긴 질문은 교수님만 볼 수 있어요.
                      </p>
                      <form
                        ref={questionFormRef}
                        action={questionAction}
                        className="space-y-2"
                      >
                        <input type="hidden" name="week_id" value={weekId} />
                        <input
                          type="hidden"
                          name="page_no"
                          value={page ?? ""}
                        />
                        <textarea
                          name="question"
                          rows={3}
                          className="w-full border border-line bg-white px-3 py-2 rounded text-sm"
                          placeholder="궁금한 점을 남겨보세요"
                        />
                        <button
                          type="submit"
                          disabled={questionIsPending}
                          className="bg-accent text-white text-sm px-4 py-2 rounded disabled:opacity-60"
                        >
                          {questionIsPending ? "전송 중..." : "질문 남기기"}
                        </button>
                        {questionState?.error && (
                          <p className="text-xs text-red-600">
                            {questionState.error}
                          </p>
                        )}
                      </form>

                      {questions.length > 0 && (
                        <div className="mt-5 pt-4 border-t border-line space-y-2 overflow-y-auto">
                          <p className="text-xs text-mute mb-1">
                            내가 남긴 질문
                          </p>
                          {questions.map((q) => (
                            <div
                              key={q.id}
                              className="border border-line rounded p-2 bg-white text-xs"
                            >
                              {q.page_no && (
                                <p className="text-mute mb-1">
                                  {q.page_no}페이지
                                </p>
                              )}
                              <p>{q.question}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
