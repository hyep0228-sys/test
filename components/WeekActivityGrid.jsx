import Link from "next/link";
import { ACTIVITIES } from "@/lib/activities";
import LectureMaterialButton from "@/components/LectureMaterialButton";

export default function WeekActivityGrid({
  week,
  completedKeys,
  note,
  questions,
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
