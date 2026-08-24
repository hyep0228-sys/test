import Link from "next/link";
import { ACTIVITIES } from "@/lib/activities";
import LectureMaterialButton from "@/components/LectureMaterialButton";

export default function WeekActivityGrid({
  week,
  completedKeys,
  materials,
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
        materials={materials ?? []}
        initialNote={note ?? ""}
        initialQuestions={questions ?? []}
      />

      {week.is_exam ? (
        <p className="border border-line rounded p-6 text-center text-mute">
          시험 주간입니다.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {ACTIVITIES.map((a) => {
            const done = completedKeys.includes(a.key);
            return (
              <Link
                key={a.key}
                href={`/week/${week.id}/${a.key}`}
                className="border border-line rounded p-5 bg-white relative"
              >
                {done && (
                  <span className="absolute top-3 right-3 text-accent">✓</span>
                )}
                <p className="font-medium">{a.label}</p>
                <p className="text-sm text-mute mt-1">{a.description}</p>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
