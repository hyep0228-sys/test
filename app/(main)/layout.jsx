import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";

export default async function MainLayout({ children }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: weeks }, { data: profile }] = await Promise.all([
    supabase
      .from("weeks")
      .select("id, short_title, is_open, is_exam")
      .order("id", { ascending: true }),
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user?.id)
      .maybeSingle(),
  ]);

  const isProfessor = profile?.role === "professor";

  // 사이드바는 lg(1024px) 부터 고정, 그 아래는 드로어다.
  // 본문 폭은 각 페이지의 <Page> 가 정한다 — 여기서 묶지 말 것.
  return (
    <div className="lg:flex lg:min-h-dvh">
      <Sidebar weeks={weeks ?? []} isProfessor={isProfessor} />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
