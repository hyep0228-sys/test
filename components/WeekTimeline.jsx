import Link from "next/link";

/**
 * 홈의 15주 타임라인.
 *
 * 홈은 주차 페이지의 복사본이 아니라 "과목 전체 중 지금 어디인가"를 보여주는 자리다.
 * 활동 버튼(LECTURE·QUIZ)은 주차 페이지가 맡는다 — 여기서 또 그리지 말 것.
 *
 * 공개 여부는 교수자가 사이드바 토글로 정한다(`weeks.is_open`).
 * 닫힌 주차도 목록에는 남기되 흐리게 두고 링크를 막는다 — 사이드바와 같은 규칙이라
 * 학생이 "몇 주차까지 열렸는지"를 두 곳에서 다르게 읽지 않는다.
 */
export default function WeekTimeline({
  weeks,
  currentWeekId,
  completedWeekIds,
  isProfessor,
}) {
  const done = new Set(completedWeekIds ?? []);

  return (
    <ol className="relative">
      {weeks.map((w, i) => {
        const isCurrent = w.id === currentWeekId;
        const isDone = done.has(w.id);
        const clickable = w.is_open || isProfessor;
        const isLast = i === weeks.length - 1;

        // 레일 선이 노드 뒤를 지나가므로 배경색은 어느 상태든 반드시 지정한다.
        // 공통 클래스에 bg-paper 를 두고 여기서 bg-ink 를 덧붙이면, 둘 다 같은
        // 유틸리티라 CSS 출력 순서가 이겨서 완료 노드의 숫자가 안 보였다.
        const node = w.is_exam
          ? "bg-paper border-dashed border-line text-mute"
          : isDone
          ? "bg-ink border-ink text-paper"
          : w.is_open
          ? "bg-paper border-ink text-ink"
          : "bg-paper border-line text-mute";

        const body = (
          <div
            className={`flex-1 min-w-0 rounded-xl border px-4 py-3 sm:px-5 sm:py-4 transition-colors ${
              isCurrent
                ? "border-accent bg-white"
                : clickable
                ? "border-line bg-white hover:border-ink"
                : "border-line bg-transparent"
            }`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[11px] tracking-wide text-mute tabular-nums">
                WEEK {String(w.id).padStart(2, "0")}
              </p>
              {isCurrent && (
                <span className="text-[11px] text-accent shrink-0">이번 주</span>
              )}
              {!isCurrent && isDone && (
                <span className="text-[11px] text-mute shrink-0">완료</span>
              )}
              {!isCurrent && !isDone && w.is_exam && (
                <span className="text-[11px] text-mute shrink-0">시험</span>
              )}
              {!isCurrent && !isDone && !w.is_exam && !w.is_open && (
                <span className="text-[11px] text-mute shrink-0">준비 중</span>
              )}
            </div>
            <p
              className={`mt-0.5 ${
                isCurrent ? "font-medium text-base sm:text-lg" : "text-sm sm:text-base"
              }`}
            >
              {w.short_title}
            </p>
          </div>
        );

        return (
          <li key={w.id} className={`relative flex gap-3 sm:gap-4 ${isLast ? "" : "pb-3"}`}>
            {/* 세로 레일 — 마지막 항목 아래로는 잇지 않는다 */}
            {!isLast && (
              <span
                aria-hidden="true"
                className="absolute left-[13px] sm:left-[15px] top-8 bottom-0 w-px bg-line"
              />
            )}
            <span
              aria-hidden="true"
              className={`relative z-10 shrink-0 mt-1 w-[27px] h-[27px] sm:w-[31px] sm:h-[31px] rounded-full border flex items-center justify-center text-[11px] tabular-nums ${node} ${
                isCurrent ? "ring-2 ring-accent ring-offset-2 ring-offset-paper" : ""
              }`}
            >
              {String(w.id).padStart(2, "0")}
            </span>

            {clickable ? (
              <Link href={`/week/${w.id}`} className="flex-1 min-w-0 flex">
                {body}
              </Link>
            ) : (
              <div className="flex-1 min-w-0 flex opacity-50">{body}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
