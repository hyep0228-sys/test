import { createClient } from "@/lib/supabase/server";

export default async function ArchivePage() {
  const supabase = await createClient();
  const { data: weeks } = await supabase
    .from("weeks")
    .select("id, short_title, full_title, is_exam")
    .order("id", { ascending: true });

  return (
    <main className="px-6 py-16">
      <h1 className="font-display text-3xl mb-10">MY ARCHIVE</h1>
      <div className="space-y-3">
        {(weeks ?? []).map((w) => (
          <div key={w.id} className="border border-line rounded p-4 bg-white">
            <p className="text-sm text-mute">
              WEEK {String(w.id).padStart(2, "0")}
            </p>
            <p className="font-medium">{w.short_title}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
