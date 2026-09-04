import { createClient } from "@/lib/supabase/server";
import Page from "@/components/Page";

/**
 * 관리자 화면의 출입문.
 *
 * 예전에는 `role !== "professor"` 검사가 관리자 페이지 5곳에 똑같이 복붙돼 있었다.
 * 새 관리자 페이지를 만들 때 검사를 빠뜨리면 그대로 뚫리는 구조라, 여기 한 곳으로 모았다.
 * **`app/(main)/admin/` 아래 새 페이지에는 권한 검사를 따로 쓰지 말 것** — 이 레이아웃이 이미 막는다.
 *
 * `(main)` 그룹 안에 있으므로 관리자 화면에도 사이드바가 그대로 붙는다.
 * 주차 열기/닫기 토글이 사이드바에 있어서, 예전처럼 홈으로 나갔다 올 필요가 없다.
 */
export default async function AdminLayout({ children }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id)
    .maybeSingle();

  if (profile?.role !== "professor") {
    return (
      <Page>
        <p className="text-mute">교수자만 접근할 수 있습니다.</p>
      </Page>
    );
  }

  return children;
}
