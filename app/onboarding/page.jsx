"use client";

import { useActionState } from "react";
import { completeOnboarding } from "@/app/actions/onboarding";

const initialState = { error: null };

export default function OnboardingPage() {
  const [state, formAction, isPending] = useActionState(
    completeOnboarding,
    initialState
  );

  return (
    <main className="px-6 py-16 max-w-md mx-auto">
      <h1 className="font-display text-3xl mb-1">처음 오셨네요</h1>
      <p className="text-mute mb-10">
        발급받은 임시 비밀번호 대신, 새 비밀번호와 닉네임/분반을 설정해주세요.
      </p>

      <form action={formAction} className="space-y-4">
        <div>
          <label className="block text-sm mb-1" htmlFor="password">
            새 비밀번호
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="w-full border border-line bg-white px-4 py-3 rounded"
          />
        </div>
        <div>
          <label className="block text-sm mb-1" htmlFor="password_confirm">
            새 비밀번호 확인
          </label>
          <input
            id="password_confirm"
            name="password_confirm"
            type="password"
            required
            minLength={6}
            className="w-full border border-line bg-white px-4 py-3 rounded"
          />
        </div>
        <div>
          <label className="block text-sm mb-1" htmlFor="nickname">
            닉네임
          </label>
          <input
            id="nickname"
            name="nickname"
            required
            className="w-full border border-line bg-white px-4 py-3 rounded"
          />
        </div>
        <div>
          <span className="block text-sm mb-1">분반</span>
          <div className="flex gap-4">
            {[1, 2, 3].map((n) => (
              <label key={n} className="flex items-center gap-1">
                <input type="radio" name="section" value={n} required />
                {n}분반
              </label>
            ))}
          </div>
        </div>

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-accent text-white py-3 rounded font-medium disabled:opacity-60"
        >
          {isPending ? "저장 중..." : "시작하기"}
        </button>
      </form>
    </main>
  );
}
