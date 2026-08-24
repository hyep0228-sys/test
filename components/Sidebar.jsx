"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions/auth";

export default function Sidebar({ weeks, isProfessor }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const activeWeekId = (() => {
    const m = pathname.match(/^\/week\/(\d+)/);
    return m ? Number(m[1]) : null;
  })();

  const close = () => setOpen(false);

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
          {weeks.map((w) => {
            const active = w.id === activeWeekId;
            const clickable = w.is_open || isProfessor;
            return (
              <Link
                key={w.id}
                href={clickable ? `/week/${w.id}` : "#"}
                onClick={clickable ? close : (e) => e.preventDefault()}
                aria-disabled={!clickable}
                className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm ${
                  active ? "bg-ink text-paper" : "hover:bg-white"
                } ${!clickable ? "opacity-40 cursor-default" : ""}`}
              >
                <span className="text-xs tabular-nums w-6 shrink-0">
                  {String(w.id).padStart(2, "0")}
                </span>
                <span className="flex-1">{w.short_title}</span>
                {w.is_exam && (
                  <span className="text-[10px] text-mute">시험</span>
                )}
              </Link>
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
