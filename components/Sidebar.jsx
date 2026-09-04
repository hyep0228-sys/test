"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { toggleWeekOpen } from "@/app/actions/weeks";

// 화면이 이 폭 이상이면 사이드바는 항상 보이는 고정 기둥, 그 아래는 드로어.
// Tailwind 의 lg 와 같은 값이라 클래스와 JS 가 어긋나지 않게 여기서 한 번만 쓴다.
const DESKTOP_QUERY = "(min-width: 1024px)";

export default function Sidebar({ weeks, isProfessor }) {
  const [open, setOpen] = useState(false);
  const [localWeeks, setLocalWeeks] = useState(weeks);
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setLocalWeeks(weeks);
  }, [weeks]);

  // 페이지가 바뀌면 드로어를 닫는다. 링크 onClick 만으로는 뒤로가기 때 안 닫혔다.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // 드로어를 연 채 데스크톱 폭으로 넓히면 열림 상태가 남아 스크롤 잠금이 안 풀린다.
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const sync = () => mq.matches && setOpen(false);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // 드로어가 열려 있는 동안 뒤 본문이 같이 스크롤되지 않게.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const activeWeekId = (() => {
    const m = pathname.match(/^\/week\/(\d+)/);
    return m ? Number(m[1]) : null;
  })();

  const close = () => setOpen(false);

  const handleToggle = (weekId, current) => {
    const next = !current;
    setLocalWeeks((prev) =>
      prev.map((w) => (w.id === weekId ? { ...w, is_open: next } : w))
    );
    startTransition(async () => {
      try {
        await toggleWeekOpen(weekId, next);
        router.refresh();
      } catch (e) {
        setLocalWeeks((prev) =>
          prev.map((w) => (w.id === weekId ? { ...w, is_open: current } : w))
        );
        alert(e.message ?? "변경에 실패했습니다.");
      }
    });
  };

  return (
    <>
      <div className="lg:hidden flex items-center justify-between gap-3 py-3 pad-safe-x border-b border-line bg-paper sticky top-0 z-20">
        <Link href="/" className="font-display text-lg truncate">
          디자인사 아카이브
        </Link>
        <button
          onClick={() => setOpen(true)}
          aria-label="주차 목차 열기"
          aria-expanded={open}
          className="shrink-0 text-sm border border-line rounded px-3 py-2"
        >
          목차
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={close}
        />
      )}

      <aside
        // visibility 도 같이 전환한다. transform 만 옮기면 화면 밖 링크가 여전히
        // 탭 포커스를 받아, 모바일에서 Tab 을 누르면 보이지 않는 목차로 끌려갔다.
        className={`fixed lg:sticky top-0 left-0 h-dvh w-72 max-w-[85vw] lg:w-64 xl:w-72 shrink-0 bg-paper border-r border-line overflow-y-auto overscroll-contain z-40 transition-[transform,visibility] duration-200 ${
          open ? "translate-x-0 visible" : "-translate-x-full invisible"
        } lg:translate-x-0 lg:visible`}
      >
        <div className="px-5 py-6 hidden lg:block">
          <Link href="/" className="font-display text-xl">
            디자인사 아카이브
          </Link>
        </div>

        <div className="flex items-center justify-between px-5 py-4 lg:hidden border-b border-line">
          <span className="text-sm text-mute">목차</span>
          <button
            onClick={close}
            aria-label="목차 닫기"
            className="text-mute text-lg leading-none px-2 py-1"
          >
            ✕
          </button>
        </div>

        <nav className="px-3 pb-4 pt-3 lg:pt-0">
          {localWeeks.map((w) => {
            const active = w.id === activeWeekId;
            const clickable = w.is_open || isProfessor;
            return (
              <div key={w.id} className="flex items-center gap-1">
                <Link
                  href={clickable ? `/week/${w.id}` : "#"}
                  onClick={clickable ? close : (e) => e.preventDefault()}
                  aria-disabled={!clickable}
                  className={`flex-1 min-w-0 flex items-center gap-3 px-3 py-3 lg:py-2.5 rounded text-sm ${
                    active ? "bg-ink text-paper" : "hover:bg-white"
                  } ${!clickable ? "opacity-40 cursor-default" : ""}`}
                >
                  <span className="text-xs tabular-nums w-6 shrink-0">
                    {String(w.id).padStart(2, "0")}
                  </span>
                  <span className="flex-1 truncate">{w.short_title}</span>
                  {w.is_exam && (
                    <span className="text-[10px] text-mute shrink-0">시험</span>
                  )}
                </Link>
                {isProfessor && (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={w.is_open}
                    onClick={() => handleToggle(w.id, w.is_open)}
                    disabled={isPending}
                    title={w.is_open ? "학생에게 공개중 · 누르면 닫기" : "학생에게 비공개 · 누르면 열기"}
                    aria-label={w.is_open ? "학생에게 공개중, 누르면 닫기" : "학생에게 비공개, 누르면 열기"}
                    className={`shrink-0 relative w-9 h-5 rounded-full transition-colors disabled:opacity-50 ${
                      w.is_open ? "bg-accent" : "bg-line"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        w.is_open ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                )}
              </div>
            );
          })}
        </nav>

        <div className="px-3 pb-6 pt-4 pad-safe-b border-t border-line mt-2 space-y-1">
          <Link
            href="/archive"
            onClick={close}
            className={`block px-3 py-3 lg:py-2 rounded text-sm ${
              pathname === "/archive" ? "bg-ink text-paper" : "text-accent"
            }`}
          >
            내 아카이브
          </Link>
          {isProfessor && (
            <Link
              href="/admin"
              onClick={close}
              className={`block px-3 py-3 lg:py-2 rounded text-sm ${
                pathname.startsWith("/admin") ? "bg-ink text-paper" : "text-accent"
              }`}
            >
              관리자
            </Link>
          )}
          <form action={signOut}>
            <button className="w-full text-left px-3 py-3 lg:py-2 text-sm text-mute">
              로그아웃
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
