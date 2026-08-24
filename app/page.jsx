import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import { ACTIVITIES } from "@/lib/activities";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: week } = await supabase
    .from("weeks")
    .select("*")
    .eq("is_open", true)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  let completedKeys = [];
  if (user && week) {
    const { data: completions } = await supabase
      .from("completions")
      .select("activity")
      .eq("user_id", user.id)
      .eq("week_id", week.id);
    completedKeys = (completions ?? []).map((c) => c.activity);
  }

  return (
    <main className="px-6 py-16">
      <div className="flex justify-between items-start mb-10">
        <div>
          <p className="text-mute text-sm">오늘의 활동</p>
        </div>
        <form action={signOut}>
          <button className="text-sm text-mute underline">로그아웃</button>
        </form>
      </div>

      {!week && (
        <p className="text-mute">현재 열려 있는 주차가 없습니다.</p>
      )}

      {week && (
        <>
          <p className="text-sm text-mute mb-1">WEEK {String(week.id).padStart(2, "0")}</p>
          <h1 className="font-display text-4xl mb-3">{week.short_title}</h1>
          {week.key_question && (
            <p className="text-mute mb-10">{week.key_question}</p>
          )}

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
      )}

      <div className="mt-16 flex gap-6 text-sm">
        <Link href="/archive" className="text-accent underline">
          내 아카이브
        </Link>
      </div>
    </main>
  );
}
