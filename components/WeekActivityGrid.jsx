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
        <p className="text-mute mb-6">{week.key_question}</p>
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
                className="aspect-square border border-line rounded-2xl bg-white relative flex flex-col items-center justify-center text-center p-6"
              >
                {done && (
                  <span className="absolute top-4 right-4 text-accent">✓</span>
                )}
                <p className="font-medium text-lg">{a.label}</p>
                <p className="text-sm text-mute mt-1">{a.description}</p>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
