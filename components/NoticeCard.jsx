function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** 홈 맨 위 공지. 내용이 없으면 페이지에서 아예 안 부른다. */
export default function NoticeCard({ text, updatedAt }) {
  return (
    <div className="border border-line border-l-2 border-l-accent rounded-xl bg-white p-4 sm:p-5 mb-8">
      <div className="flex items-baseline justify-between gap-3 mb-1.5">
        <p className="text-[11px] tracking-wide text-accent">공지</p>
        {updatedAt && (
          <p className="text-[11px] text-mute shrink-0">
            {formatDate(updatedAt)}
          </p>
        )}
      </div>
      <p className="text-sm whitespace-pre-wrap leading-relaxed">{text}</p>
    </div>
  );
}
