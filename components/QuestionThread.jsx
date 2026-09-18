"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { postQuestionReply } from "@/app/actions/questionReplies";
import { REPLY_MAX_LENGTH } from "@/lib/questionReplies";

const initialState = { reply: null, error: null };

function formatTime(iso) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

/**
 * 질문 하나를 채팅처럼 주고받는 스레드.
 *
 * 교수자와 그 질문을 쓴 학생만 보고 쓸 수 있다(DB 정책도 같다). 관리자 화면과
 * 학생 화면이 같은 컴포넌트를 쓴다 — 말풍선 방향만 보는 사람 기준으로 갈린다.
 *
 * 맨 처음 말풍선은 질문 자체다. 답글이 없으면 "아직 답변이 없습니다"가 아니라
 * 질문만 놓인 빈 대화로 보이는 게 맞다.
 */
export default function QuestionThread({
  questionId,
  question,
  questionAt,
  askedByMe = false,
  replies: initialReplies,
  viewerIsProfessor = false,
}) {
  const [replies, setReplies] = useState(initialReplies ?? []);
  const [state, formAction, isPending] = useActionState(
    postQuestionReply,
    initialState
  );
  const formRef = useRef(null);

  useEffect(() => {
    if (state?.reply) {
      setReplies((prev) =>
        prev.some((r) => r.id === state.reply.id) ? prev : [...prev, state.reply]
      );
      formRef.current?.reset();
    }
  }, [state]);

  // 보는 사람이 쓴 말풍선은 오른쪽에 둔다.
  const isMine = (r) =>
    viewerIsProfessor ? r.profiles?.role === "professor" : r.profiles?.role !== "professor";

  return (
    <div className="mt-3 border-t border-line pt-3">
      <div className="space-y-2">
        <div className="flex justify-start">
          <div
            className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs bg-paper border border-line ${
              askedByMe ? "" : ""
            }`}
          >
            <p className="text-[11px] text-mute mb-0.5">
              {askedByMe ? "내 질문" : "학생 질문"}
            </p>
            <p className="whitespace-pre-wrap leading-relaxed">{question}</p>
            {questionAt && (
              <p className="text-[10px] text-mute mt-1">{formatTime(questionAt)}</p>
            )}
          </div>
        </div>

        {replies.map((r) => {
          const mine = isMine(r);
          const fromProfessor = r.profiles?.role === "professor";
          return (
            <div key={r.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs border ${
                  fromProfessor
                    ? "border-accent/40 bg-accent/5"
                    : "border-line bg-paper"
                }`}
              >
                <p className="text-[11px] text-mute mb-0.5">
                  {fromProfessor ? "교수님" : mine ? "나" : r.profiles?.nickname ?? "학생"}
                </p>
                <p className="whitespace-pre-wrap leading-relaxed">{r.body}</p>
                <p className="text-[10px] text-mute mt-1">{formatTime(r.created_at)}</p>
              </div>
            </div>
          );
        })}
      </div>

      <form ref={formRef} action={formAction} className="mt-3 flex items-end gap-2">
        <input type="hidden" name="question_id" value={questionId} />
        <textarea
          name="body"
          rows={1}
          maxLength={REPLY_MAX_LENGTH}
          placeholder={viewerIsProfessor ? "답변을 쓰세요" : "이어서 물어보세요"}
          className="flex-1 min-w-0 border border-line bg-white px-3 py-2 rounded-2xl text-xs resize-none leading-relaxed"
        />
        <button
          type="submit"
          disabled={isPending}
          className="shrink-0 bg-accent text-white text-xs px-4 min-h-11 rounded-2xl disabled:opacity-60"
        >
          {isPending ? "보내는 중..." : "보내기"}
        </button>
      </form>

      {state?.error && (
        <p className="text-xs text-red-600 mt-1.5">{state.error}</p>
      )}
    </div>
  );
}
