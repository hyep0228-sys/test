"use client";

import { useState, useTransition } from "react";
import { submitQuizAnswer, completeQuiz } from "@/app/actions/quiz";

export default function QuizPlayer({ weekId, questions }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();

  const question = questions[index];
  const isLast = index === questions.length - 1;
  const answered = selected !== null;

  function choose(choiceIndex) {
    if (answered || isPending) return;
    const isCorrect = choiceIndex === question.answer_index;
    setSelected(choiceIndex);
    if (isCorrect) setScore((s) => s + 1);

    startTransition(async () => {
      try {
        await submitQuizAnswer({
          questionId: question.id,
          selectedIndex: choiceIndex,
          isCorrect,
        });
      } catch (e) {
        setError(e.message ?? "저장에 실패했습니다.");
      }
    });
  }

  function next() {
    if (!isLast) {
      setIndex((i) => i + 1);
      setSelected(null);
      return;
    }
    startTransition(async () => {
      try {
        await completeQuiz(weekId);
      } catch (e) {
        setError(e.message ?? "완료 처리에 실패했습니다.");
      }
    });
  }

  return (
    <div>
      <div className="flex justify-between items-baseline mb-6 text-sm text-mute">
        <span>
          {index + 1} / {questions.length}
        </span>
        <span>지금까지 {score}개 정답</span>
      </div>

      <p className="text-lg font-medium mb-6">{question.question}</p>

      {question.image_url && (
        <img
          src={question.image_url}
          alt=""
          className="w-full max-h-[60vh] rounded-2xl border border-line mb-6 object-contain bg-white"
        />
      )}

      <div className="flex flex-col gap-3 mb-6">
        {question.choices.map((choice, i) => {
          let style = "border-line bg-white";
          if (answered) {
            if (i === question.answer_index) {
              style = "border-accent bg-white";
            } else if (i === selected) {
              style = "border-red-400 bg-white";
            } else {
              style = "border-line bg-white opacity-50";
            }
          }
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              disabled={answered}
              className={`text-left border rounded-2xl px-4 py-3.5 text-sm sm:text-base ${style}`}
            >
              {choice}
              {answered && i === question.answer_index && (
                <span className="text-accent ml-2">✓ 정답</span>
              )}
            </button>
          );
        })}
      </div>

      {answered && question.explanation && (
        <div className="border border-line rounded-2xl p-4 bg-white mb-6 text-sm">
          <p className="text-mute mb-1">해설</p>
          <p>{question.explanation}</p>
        </div>
      )}

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {answered && (
        <button
          onClick={next}
          disabled={isPending}
          className="w-full bg-accent text-white py-3.5 rounded-2xl font-medium disabled:opacity-60"
        >
          {isPending
            ? "처리 중..."
            : isLast
            ? "완료하기"
            : "다음 문제"}
        </button>
      )}
    </div>
  );
}
