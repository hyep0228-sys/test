/** 학생이 보는 그 주차의 논의 주제. 주제가 없으면 페이지에서 아예 안 부른다. */
export default function DiscussionTopicCard({ topic }) {
  return (
    <div className="border border-line border-l-2 border-l-accent rounded-2xl bg-white p-5 sm:p-6 mb-8">
      <p className="text-[11px] tracking-wide text-accent mb-1.5">논의 주제</p>
      <p className="whitespace-pre-wrap leading-relaxed">{topic}</p>
    </div>
  );
}
