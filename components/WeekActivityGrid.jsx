import Link from "next/link";
import { ACTIVITIES } from "@/lib/activities";
import LectureMaterialButton from "@/components/LectureMaterialButton";
import DiscussionToggle from "@/components/DiscussionToggle";

export default function WeekActivityGrid({
  week,
  completedKeys,
  note,
  questions,
  discussionCount = 0,
  isProfessor = false,
}) {
  // 지금은 활동이 QUIZ 하나뿐이라 한 줄로 쌓는다. 나중에 lib/activities.js 에
  // 항목을 되살리면 넓은 화면에서 자동으로 2단이 된다.
  const multi = ACTIVITIES.length > 1;

  return (
    <>
      <p className="text-sm text-mute mb-1">
        WEEK {String(week.id).padStart(2, "0")}
      </p>
      <h1 className="font-display text-3xl sm:text-4xl mb-3">{week.short_title}</h1>
      {week.key_question && (
        <p className="text-mute mb-6">{week.key_question}</p>
      )}

      {/* 팀 논의는 수업이 일찍 끝난 날에만 연다. 교수자는 여기서 바로 열고 닫는다. */}
      {isProfessor && (
        <div className="mb-6">
          <DiscussionToggle weekId={week.id} open={week.discussion_open} />
        </div>
      )}

      <LectureMaterialButton
        weekId={week.id}
        initialNote={note ?? ""}
        initialQuestions={questions ?? []}
      />

      {week.is_exam ? (
        <p className="border border-line rounded-2xl p-6 text-center text-mute">
          시험 주간입니다.
        </p>
      ) : (
        <div className={multi ? "grid gap-4 sm:grid-cols-2" : "flex flex-col gap-4"}>
          {(week.discussion_open || discussionCount > 0) && (
            <Link
              href={`/week/${week.id}/discussion`}
              className="w-full border border-line rounded-2xl bg-white relative flex flex-col items-center justify-center text-center py-5 sm:py-6 px-6 hover:border-ink transition-colors"
            >
              <p className="font-medium">팀 논의</p>
              <p className="text-xs text-mute mt-1">
                {discussionCount > 0
                  ? `${discussionCount}개 글`
                  : "아직 올라온 글이 없습니다"}
              </p>
            </Link>
          )}
          {ACTIVITIES.map((a) => {
            const done = completedKeys.includes(a.key);
            return (
              <Link
                key={a.key}
                href={`/week/${week.id}/${a.key}`}
                className="w-full border border-line rounded-2xl bg-white relative flex flex-col items-center justify-center text-center py-5 sm:py-6 px-6 hover:border-ink transition-colors"
              >
                {done && (
                  <span className="absolute top-3 right-3 text-accent">✓</span>
                )}
                <p className="font-medium">{a.label}</p>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
