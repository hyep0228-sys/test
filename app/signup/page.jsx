"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp } from "@/app/actions/auth";

const initialState = { error: null };

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signUp, initialState);

  return (
    <main className="px-6 py-16">
      <h1 className="font-display text-3xl mb-1">회원가입</h1>
      <p className="text-mute mb-10">이름, 학번, 분반, 닉네임을 입력하세요</p>

      <form action={formAction} className="space-y-4">
        <div>
          <label className="block text-sm mb-1" htmlFor="name">
            이름
          </label>
          <input
            id="name"
            name="name"
            required
            className="w-full border border-line bg-white px-4 py-3 rounded"
          />
        </div>
        <div>
          <label className="block text-sm mb-1" htmlFor="student_no">
            학번
          </label>
          <input
            id="student_no"
            name="student_no"
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
          <label className="block text-sm mb-1" htmlFor="password">
            비밀번호
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

        {state?.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-accent text-white py-3 rounded font-medium disabled:opacity-60"
        >
          {isPending ? "가입 중..." : "가입하기"}
        </button>
      </form>

      <p className="text-sm text-mute mt-6">
        이미 계정이 있나요?{" "}
        <Link href="/login" className="text-accent underline">
          로그인
        </Link>
      </p>
    </main>
  );
}
