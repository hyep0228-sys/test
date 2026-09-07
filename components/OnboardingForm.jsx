"use client";

import { useActionState } from "react";
import { completeOnboarding } from "@/app/actions/onboarding";

const initialState = { error: null };
const FIELD = "w-full border border-line bg-white px-4 py-3 rounded";

export default function OnboardingForm({ name, section, nickname }) {
  const [state, formAction, isPending] = useActionState(
    completeOnboarding,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm mb-1" htmlFor="password">새 비밀번호</label>
        <input id="password" name="password" type="password" required minLength={6}
          autoComplete="new-password" className={FIELD} />
        <p className="text-mute text-xs mt-1.5">6자 이상. 000000 은 쓸 수 없습니다.</p>
      </div>
      <div>
        <label className="block text-sm mb-1" htmlFor="password_confirm">새 비밀번호 확인</label>
        <input id="password_confirm" name="password_confirm" type="password" required minLength={6}
          autoComplete="new-password" className={FIELD} />
      </div>
      <div>
        <label className="block text-sm mb-1" htmlFor="nickname">닉네임</label>
        <input id="nickname" name="nickname" required defaultValue={nickname ?? ""}
          className={FIELD} />
        <p className="text-mute text-xs mt-1.5">
          팀 논의에 글을 올리면 이 이름으로 보입니다.
        </p>
      </div>

      {/* 분반은 계정 만들 때 이미 들어간다. 비어 있는 계정만 묻는다. */}
      {!section && (
        <div>
          <span className="block text-sm mb-1">분반</span>
          <div className="flex gap-4">
            {[1, 2, 3].map((n) => (
              <label key={n} className="flex items-center gap-1.5 min-h-11">
                <input type="radio" name="section" value={n} required />
                {n}분반
              </label>
            ))}
          </div>
        </div>
      )}

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button type="submit" disabled={isPending}
        className="w-full bg-accent text-white py-3 rounded font-medium disabled:opacity-60">
        {isPending ? "저장 중..." : "시작하기"}
      </button>
    </form>
  );
}
