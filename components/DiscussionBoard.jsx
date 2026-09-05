import DiscussionPostCard from "@/components/DiscussionPostCard";

/**
 * 조 이름으로 묶어 보여준다. 조는 그날 랜덤이라 명단이 없고,
 * 학생이 적어 넣은 `team_name` 이 유일한 기준이다.
 */
export default function DiscussionBoard({ teams, currentUserId, isProfessor }) {
  return (
    <div className="space-y-8">
      {teams.map((team) => (
        <section key={team.name}>
          <div className="flex items-baseline gap-3 mb-3 pb-2 border-b border-line">
            <h2 className="font-medium">{team.name}</h2>
            <span className="text-xs text-mute">{team.posts.length}개</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {team.posts.map((p) => (
              <DiscussionPostCard
                key={p.id}
                post={p}
                imageUrl={p.imageUrl}
                canDelete={isProfessor || p.user_id === currentUserId}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
