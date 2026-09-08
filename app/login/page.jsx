"use client";

import { useActionState, useEffect, useState } from "react";
import { signIn } from "@/app/actions/auth";
import Page from "@/components/Page";

const initialState = { error: null };

const FIELD =
  "w-full border border-line bg-white px-4 py-3 rounded";

/**
 * 2단계 로그인 — ① 학번 + 이름 → ② 비밀번호.
 *
 * 1단계에서는 서버에 묻지 않는다. 여기서 학번·이름을 대조해주면 비밀번호 없이도
 * "이 학번의 이름이 무엇인지" 를 알아낼 수 있는 창구가 된다.
 * 셋을 한꺼번에 서버가 확인하고, 비밀번호를 통과한 뒤에야 이름을 본다.
 */
export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(signIn, initialState);
  const [step, setStep] = useState(1);
  const [studentNo, setStudentNo] = useState("");
  const [name, setName] = useState("");

  // 이름이 틀렸다는 답이 오면 1단계로 되돌린다 — 고쳐야 할 칸이 거기 있다.
  useEffect(() => {
    if (state?.step === "identity") setStep(1);
  }, [state]);

  const canGoNext = studentNo.trim() !== "" && name.trim() !== "";

  return (
    <Page width="form" center>
      <h1 className="font-display text-2xl sm:text-3xl mb-1">디자인사 아카이브</h1>
      <p className="text-mute mb-10">
        {step === 1 ? "학번과 이름을 입력하세요" : "비밀번호를 입력하세요"}
      </p>

      <form action={formAction} className="space-y-4">
        {/* 2단계에서도 값이 함께 넘어가야 한다 */}
        <div className={step === 1 ? "space-y-4" : "hidden"}>
          <div>
            <label className="block text-sm mb-1" htmlFor="student_no">학번</label>
            {/* inputMode 를 numeric 으로 두면 폰에서 숫자 키패드만 떠서
                'C475123' 처럼 영문자로 시작하는 학번을 아예 못 친다. */}
            <input
              id="student_no"
              name="student_no"
              autoComplete="username"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              value={studentNo}
              onChange={(e) => setStudentNo(e.target.value)}
              className={FIELD}
            />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="name">이름</label>
            <input
              id="name"
              name="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={FIELD}
            />
          </div>
        </div>

        {step === 2 && (
          <>
            <p className="text-sm text-mute">
              {studentNo} · {name}{" "}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setStep(1); }}
                className="text-accent underline ml-1"
              >
                고치기
              </button>
            </p>
            <div>
              <label className="block text-sm mb-1" htmlFor="password">비밀번호</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                autoFocus
                className={FIELD}
              />
            </div>
          </>
        )}

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        {/* key 를 달아 두 버튼이 서로 다른 DOM 이 되게 한다. 같은 노드를 재사용하면
            onClick 에서 step 이 바뀌는 순간 type 이 submit 으로 갈아끼워지고,
            브라우저가 그 뒤에 기본 동작을 실행해 폼이 그대로 제출돼 버린다.
            preventDefault 까지 걸어 두 겹으로 막는다. */}
        {step === 1 ? (
          <button
            key="next"
            type="button"
            disabled={!canGoNext}
            onClick={(e) => { e.preventDefault(); setStep(2); }}
            className="w-full bg-accent text-white py-3 rounded font-medium disabled:opacity-40"
          >
            다음
          </button>
        ) : (
          <button
            key="submit"
            type="submit"
            disabled={isPending}
            className="w-full bg-accent text-white py-3 rounded font-medium disabled:opacity-60"
          >
            {isPending ? "로그인 중..." : "로그인"}
          </button>
        )}
      </form>

      <p className="text-sm text-mute mt-6 leading-relaxed">
        계정은 교수님이 미리 만들어둡니다. <b>첫 비밀번호는 000000</b>(0 여섯 개)이고,
        처음 로그인하면 새 비밀번호를 정하게 됩니다.
        <br />
        비밀번호를 잊었다면 교수님께 말씀해주세요 — 초기화해드립니다.
      </p>
    </Page>
  );
}
