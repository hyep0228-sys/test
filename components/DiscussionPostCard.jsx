"use client";

import { useState, useTransition } from "react";
import { deleteDiscussionPost } from "@/app/actions/discussion";

/**
 * 글 한 장. 지우기는 본인 글이거나 교수자일 때만 뜬다(실제 차단은 RLS 가 한다).
 */
export default function DiscussionPostCard({ post, imageUrl, canDelete }) {
  const [gone, setGone] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (gone) return null;

  const remove = () => {
    if (!confirm("이 글을 지울까요?")) return;
    startTransition(async () => {
      try {
        await deleteDiscussionPost(post.id);
        setGone(true);
      } catch (e) {
        alert(e.message ?? "삭제에 실패했습니다.");
      }
    });
  };

  return (
    <div className="border border-line rounded-xl bg-white p-4">
      {post.body && (
        <p className="text-sm whitespace-pre-wrap leading-relaxed mb-3">
          {post.body}
        </p>
      )}

      {post.link_url && (
        <a
          href={post.link_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-sm text-accent underline break-all mb-3"
        >
          {post.link_url}
        </a>
      )}

      {imageUrl && (
        <a href={imageUrl} target="_blank" rel="noopener noreferrer">
          <img
            src={imageUrl}
            alt=""
            className="w-full max-h-96 object-contain rounded-lg border border-line bg-paper mb-3"
          />
        </a>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-mute min-w-0 truncate">
          {post.author_nickname ?? "익명"}
        </p>
        {canDelete && (
          <button
            type="button"
            onClick={remove}
            disabled={isPending}
            className="text-xs text-mute shrink-0 disabled:opacity-50"
          >
            지우기
          </button>
        )}
      </div>
    </div>
  );
}
