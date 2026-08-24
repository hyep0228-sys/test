"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn } from "@/app/actions/auth";

const initialState = { error: null };

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(signIn, initialState);

  return (
    <main className="px-6 py-16 max-w-md mx-auto">
      <h1 className="font-display text-3xl mb-1">디자인사 아카이브</h1>
      <p className="text-mute mb-10">학번으로 로그인하세요</p>

      <form action={formAction} className="space-y-4">
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
          <label className="block text-sm mb-1" htmlFor="password">
            비밀번호
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
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
          {isPending ? "로그인 중..." : "로그인"}
        </button>
      </form>

      <p className="text-sm text-mute mt-6">
        계정이 없나요?{" "}
        <Link href="/signup" className="text-accent underline">
          회원가입
        </Link>
      </p>
    </main>
  );
}
