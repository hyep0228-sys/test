"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// HEIC 는 받지 않는다 — 브라우저 대부분이 못 그려서 올려도 안 보인다.
// 아이폰은 파일 선택 시 대개 JPEG 으로 바꿔 올려주므로 실제로 걸릴 일은 드물다.
const ALLOWED_IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

async function requireProfessor(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id)
    .maybeSingle();
  if (profile?.role !== "professor") throw new Error("권한이 없습니다.");
  return user;
}

/** 교수자가 그 주차의 팀 논의를 열고 닫는다. */
export async function toggleDiscussionOpen(weekId, nextValue) {
  const supabase = await createClient();
  await requireProfessor(supabase);

  const { error } = await supabase
    .from("weeks")
    .update({ discussion_open: nextValue })
    .eq("id", weekId);

  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
}

/**
 * 링크는 화면에서 <a> 로 나가므로 스킴을 반드시 확인한다.
 * javascript: 같은 걸 그대로 걸면 누른 사람 브라우저에서 실행된다.
 */
function normalizeLink(raw) {
  const value = raw?.toString().trim();
  if (!value) return null;
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(
      "링크 형식이 올바르지 않습니다. https:// 로 시작하는 주소를 넣어주세요.",
    );
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("http 또는 https 주소만 올릴 수 있습니다.");
  }
  return url.toString();
}

export async function createDiscussionPost(prevState, formData) {
  const weekId = Number(formData.get("week_id"));
  const teamName = formData.get("team_name")?.toString().trim();
  const body = formData.get("body")?.toString().trim() ?? "";
  const rawLink = formData.get("link_url");
  const image = formData.get("image");

  if (!teamName) return { error: "조 이름을 적어주세요." };
  if (teamName.length > 40) return { error: "조 이름이 너무 깁니다." };

  let linkUrl;
  try {
    linkUrl = normalizeLink(rawLink);
  } catch (e) {
    return { error: e.message };
  }

  const hasImage = image && typeof image === "object" && image.size > 0;
  if (!body && !linkUrl && !hasImage) {
    return { error: "내용, 링크, 사진 중 하나는 있어야 합니다." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  // profiles 는 본인 행만 읽히므로, 다른 학생이 이 글을 볼 때 닉네임을 알 수 없다.
  // 그래서 올리는 시점에 닉네임을 글에 함께 적어 둔다.
  const { data: me } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("id", user.id)
    .maybeSingle();

  let imagePath = null;
  if (hasImage) {
    const ext = ALLOWED_IMAGE_TYPES[image.type];
    if (!ext) {
      return { error: "JPG · PNG · WEBP · GIF 사진만 올릴 수 있습니다." };
    }
    if (image.size > MAX_IMAGE_BYTES) {
      return { error: "사진은 5MB 까지 올릴 수 있습니다." };
    }
    const path = `discussions/${weekId}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("content")
      .upload(path, image, { contentType: image.type, upsert: false });
    if (uploadError)
      return { error: `사진 업로드에 실패했습니다. ${uploadError.message}` };
    imagePath = path;
  }

  const { error } = await supabase.from("discussion_posts").insert({
    week_id: weekId,
    user_id: user.id,
    team_name: teamName,
    body: body || null,
    link_url: linkUrl,
    image_path: imagePath,
    author_nickname: me?.nickname ?? null,
  });

  if (error) {
    // 글 저장이 실패했는데 사진만 남으면 주인 없는 파일이 된다.
    if (imagePath) await supabase.storage.from("content").remove([imagePath]);
    return { error: error.message };
  }

  revalidatePath(`/week/${weekId}/discussion`);
  return { created: true };
}

/** 본인 글이거나 교수자면 지운다. 실제 권한은 RLS 가 다시 확인한다. */
export async function deleteDiscussionPost(postId) {
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("discussion_posts")
    .select("week_id, image_path")
    .eq("id", postId)
    .maybeSingle();

  const { error } = await supabase
    .from("discussion_posts")
    .delete()
    .eq("id", postId);

  if (error) throw new Error(error.message);

  if (post?.image_path) {
    await supabase.storage.from("content").remove([post.image_path]);
  }
  if (post?.week_id) revalidatePath(`/week/${post.week_id}/discussion`);
}
