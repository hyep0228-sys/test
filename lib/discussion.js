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
