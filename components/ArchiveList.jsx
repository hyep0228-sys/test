import Link from "next/link";

function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/**
 * MY ARCHIVE 의 주차별 카드 목록.
 *
 * 데이터 수집은 `app/(main)/archive/page.jsx` 가 하고, 여기는 그리기만 한다
 * (`WeekTimeline` 과 같은 구조). rows 는 이미 "뭔가 남긴 주차"만 걸러진 상태로 들어온다.
 */
export default function ArchiveList({ rows }) {
  return (
    <div className="space-y-4">
      {rows.map(({ week, note, questions, quiz, quizTotal, quizDone }) => (
        <section
          key={week.id}
          className="border border-line rounded-2xl bg-white p-5 sm:p-6"
        >
          <div className="flex items-baseline justify-between gap-3 mb-4">
            <div className="min-w-0">
              <p className="text-[11px] tracking-wide text-mute tabular-nums">
                WEEK {String(week.id).padStart(2, "0")}
              </p>
              <h2 className="font-medium text-base sm:text-lg truncate">
                {week.short_title}
              </h2>
            </div>
            <Link
              href={`/week/${week.id}`}
              className="text-xs text-accent shrink-0"
            >
              주차로 →
            </Link>
          </div>

          <div className="space-y-4">
            {quiz && (
              <p className="text-sm">
                <span className="text-mute">퀴즈</span>{" "}
                <span className="tabular-nums">
                  {quiz.correct} / {quizTotal || quiz.answered} 정답
                </span>
                {!quizDone && (
                  <span className="text-mute text-xs ml-2">(푸는 중)</span>
                )}
              </p>
            )}

            {note && (
              <div>
                <p className="text-mute text-xs mb-1.5">내 메모</p>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {note.text}
                </p>
              </div>
            )}

            {questions.length > 0 && (
              <div>
                <p className="text-mute text-xs mb-1.5">
                  내 질문 {questions.length}개
                </p>
                <ul className="space-y-2">
                  {questions.map((q) => (
                    <li
                      key={q.id}
                      className="text-sm border-l-2 border-line pl-3"
                    >
                      <p className="whitespace-pre-wrap">{q.question}</p>
                      <p className="text-mute text-xs mt-1">
                        {q.page_no ? `${q.page_no}페이지 · ` : ""}
                        {formatDate(q.created_at)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
