"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { toggleWeekOpen } from "@/app/actions/weeks";

export default function Sidebar({ weeks, isProfessor }) {
  const [open, setOpen] = useState(false);
  const [localWeeks, setLocalWeeks] = useState(weeks);
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setLocalWeeks(weeks);
  }, [weeks]);

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
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-line bg-paper sticky top-0 z-20">
        <Link href="/" className="font-display text-lg">
          디자인사 아카이브
        </Link>
        <button
          onClick={() => setOpen(true)}
          aria-label="주차 목차 열기"
          className="text-sm border border-line rounded px-3 py-1.5"
        >
          목차
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={close}
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 shrink-0 bg-paper border-r border-line overflow-y-auto z-40 transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="px-5 py-6 hidden md:block">
          <Link href="/" className="font-display text-xl">
            디자인사 아카이브
          </Link>
        </div>

        <nav className="px-3 pb-4 pt-4 md:pt-0">
          {localWeeks.map((w) => {
            const active = w.id === activeWeekId;
            const clickable = w.is_open || isProfessor;
            return (
              <div key={w.id} className="flex items-center gap-1">
                <Link
                  href={clickable ? `/week/${w.id}` : "#"}
                  onClick={clickable ? close : (e) => e.preventDefault()}
                  aria-disabled={!clickable}
                  className={`flex-1 min-w-0 flex items-center gap-3 px-3 py-2.5 rounded text-sm ${
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
                    onClick={() => handleToggle(w.id, w.is_open)}
                    disabled={isPending}
                    title={w.is_open ? "학생에게 닫기" : "학생에게 열기"}
                    aria-label={w.is_open ? "학생에게 닫기" : "학생에게 열기"}
                    className="shrink-0 w-8 h-8 flex items-center justify-center rounded text-sm hover:bg-white disabled:opacity-50"
                  >
                    {w.is_open ? "🔓" : "🔒"}
                  </button>
                )}
              </div>
            );
          })}
        </nav>

        <div className="px-3 pb-6 pt-4 border-t border-line mt-2 space-y-1">
          <Link
            href="/archive"
            onClick={close}
            className={`block px-3 py-2 rounded text-sm ${
              pathname === "/archive" ? "bg-ink text-paper" : "text-accent"
            }`}
          >
            내 아카이브
          </Link>
          <form action={signOut}>
            <button className="w-full text-left px-3 py-2 text-sm text-mute">
              로그아웃
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
