import Link from "next/link";
import { ACTIVITIES } from "@/lib/activities";
import LectureMaterialButton from "@/components/LectureMaterialButton";

export default function WeekActivityGrid({
  week,
  completedKeys,
  note,
  questions,
}) {
  return (
    <>
      <p className="text-sm text-mute mb-1">
        WEEK {String(week.id).padStart(2, "0")}
      </p>
      <h1 className="font-display text-4xl mb-3">{week.short_title}</h1>
      {week.key_question && (
        <p className="text-mute mb-4">{week.key_question}</p>
      )}
      {week.keywords?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {week.keywords.map((kw) => (
            <span
              key={kw}
              className="text-xs text-mute border border-line rounded-full px-3 py-1"
            >
              {kw}
            </span>
          ))}
        </div>
      )}

      <LectureMaterialButton
        weekId={week.id}
        initialNote={note ?? ""}
        initialQuestions={questions ?? []}
      />

      {week.is_exam ? (
        <p className="border border-line rounded p-6 text-center text-mute">
          시험 주간입니다.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {ACTIVITIES.map((a) => {
            const done = completedKeys.includes(a.key);
            return (
              <Link
                key={a.key}
                href={`/week/${week.id}/${a.key}`}
                className="w-full border border-line rounded-2xl bg-white relative flex flex-col items-center justify-center text-center py-5 px-6"
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
