"use client";

function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * MY ARCHIVE 의 「내 메모 내려받기」.
 *
 * 메모 기능은 2026-2학기까지만 쓰고 학기가 끝나면 데이터를 리셋한다. 그 전에 학생이 자기 메모를
 * 가져갈 수 있게 주차별로 묶어 .txt 한 파일로 내려준다. 서버를 다시 부르지 않고 페이지가 이미
 * 받은 본인 메모(RLS 로 본인 것만 온다)를 그대로 쓴다.
 *
 * 맨 앞 BOM(U+FEFF)은 윈도 옛 메모장이 UTF-8 한글을 깨뜨리지 않게 하려는 것이다.
 */
export default function DownloadNotesButton({ notes }) {
  if (notes.length === 0) return null;

  const handle = () => {
    const body = notes
      .map(
        (n) =>
          `■ ${n.weekId}주차 · ${n.title}\n(마지막 수정 ${formatDate(n.updatedAt)})\n\n${n.text.trim()}\n`
      )
      .join("\n\n");
    const content = `\uFEFF디자인사 · 내 메모\n\n\n${body}`;

    const url = URL.createObjectURL(
      new Blob([content], { type: "text/plain;charset=utf-8" })
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "디자인사_내메모.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <button
      type="button"
      onClick={handle}
      className="shrink-0 text-xs px-4 min-h-11 inline-flex items-center rounded border border-line"
    >
      내 메모 내려받기 (.txt)
    </button>
  );
}
