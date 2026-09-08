/**
 * 글 목록을 조 이름으로 묶는다. 조가 처음 등장한 순서를 유지해서,
 * 새로고침할 때마다 화면 순서가 바뀌지 않게 한다.
 */
export function groupByTeam(posts) {
  const byName = new Map();
  for (const p of posts) {
    if (!byName.has(p.team_name)) byName.set(p.team_name, []);
    byName.get(p.team_name).push(p);
  }
  return [...byName.entries()].map(([name, list]) => ({ name, posts: list }));
}

/** 저장된 경로를 public 버킷의 실제 주소로 바꾼다. */
export function withImageUrls(supabase, posts) {
  return posts.map((p) => ({
    ...p,
    imageUrl: p.image_path
      ? supabase.storage.from("content").getPublicUrl(p.image_path).data
          .publicUrl
      : null,
  }));
}

/**
 * 교수자가 적는 그 주차의 논의 주제. 한 주차에 하나뿐이고 weeks 테이블에 들어간다.
 * 상수를 "use server" 액션 파일에 두면 빌드가 깨져서 여기 둔다.
 */
export const TOPIC_MAX_LENGTH = 500;
