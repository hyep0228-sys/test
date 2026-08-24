import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";

export default async function MainLayout({ children }) {
  const supabase = await createClient();
  const { data: weeks } = await supabase
    .from("weeks")
    .select("id, short_title, is_open, is_exam")
    .order("id", { ascending: true });

  return (
    <div className="md:flex md:min-h-screen">
      <Sidebar weeks={weeks ?? []} />
      <div className="flex-1 min-w-0">
        <div className="max-w-md mx-auto min-h-screen">{children}</div>
      </div>
    </div>
  );
}
