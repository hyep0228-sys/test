import { createClient } from "@/lib/supabase/server";
import Page from "@/components/Page";
import OnboardingForm from "@/components/OnboardingForm";
import { signOut } from "@/app/actions/auth";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, section, nickname")
    .eq("id", user?.id)
    .maybeSingle();

  return (
    <Page width="form" center>
      <h1 className="font-display text-2xl sm:text-3xl mb-1">
        {profile?.name ? `${profile.name}님, 반갑습니다` : "처음 오셨네요"}
      </h1>
      <p className="text-mute mb-10 leading-relaxed">
        받으신 비밀번호(000000) 대신 <b>새 비밀번호</b>와 <b>닉네임</b>을 정해주세요.
        {profile?.section ? ` 분반은 ${profile.section}분반으로 등록돼 있습니다.` : ""}
      </p>
      <OnboardingForm
        name={profile?.name}
        section={profile?.section}
        nickname={profile?.nickname}
      />

      {/* 온보딩을 마치기 전에는 다른 화면으로 못 나간다. 잘못 로그인했을 때
          빠져나갈 길이 여기 하나뿐이라 로그아웃을 붙여둔다. */}
      <form action={signOut} className="mt-8 text-center">
        <button className="text-mute text-sm underline min-h-11 px-3">
          다른 계정으로 로그인
        </button>
      </form>
    </Page>
  );
}
