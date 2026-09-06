"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, Eye, MessageCircle, Trash2, Send } from "lucide-react";
import { formatRelativeTime } from "@/lib/format-relative-time";
import {
  addComment,
  deleteComment,
  deleteCommunityPost,
  incrementPostView,
  likeCommunityPost,
  type CommunityComment,
  type CommunityPost,
} from "@/lib/community/actions";
import type { CommunityTheme } from "@/lib/community/theme";
import { ImageGallery } from "./image-gallery";

const LIKED_POSTS_KEY_PREFIX = "community_liked_posts_";

function loadLikedPostIds(basePath: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(`${LIKED_POSTS_KEY_PREFIX}${basePath}`);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

type PostDetailViewProps = {
  theme: CommunityTheme;
  initialPost: CommunityPost;
  initialComments: CommunityComment[];
};

export function PostDetailView({ theme, initialPost, initialComments }: PostDetailViewProps) {
  const router = useRouter();
  const [post, setPost] = useState(initialPost);
  const [comments, setComments] = useState(initialComments);
  const [hasLiked, setHasLiked] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const hasCountedView = useRef(false);

  useEffect(() => {
    setHasLiked(loadLikedPostIds(theme.basePath).has(post.id));

    if (!hasCountedView.current) {
      hasCountedView.current = true;
      setPost(prev => ({ ...prev, views: prev.views + 1 }));
      incrementPostView(post.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLike = async () => {
    if (hasLiked) return;
    setHasLiked(true);
    setPost(prev => ({ ...prev, likes: prev.likes + 1 }));
    try {
      const ids = loadLikedPostIds(theme.basePath);
      ids.add(post.id);
      window.localStorage.setItem(`${LIKED_POSTS_KEY_PREFIX}${theme.basePath}`, JSON.stringify(Array.from(ids)));
    } catch {
      // ignore storage failures (e.g. private browsing)
    }
    await likeCommunityPost(post.id, theme.basePath);
  };

  const handleDeletePost = async () => {
    if (!window.confirm(`"${post.title}" ${theme.itemNoun.toLowerCase()}ini silmek istediğine emin misin?`)) return;
    await deleteCommunityPost(post.id, theme.basePath);
    router.push(theme.basePath);
  };

  const handleDeleteComment = async (comment: CommunityComment) => {
    setComments(prev => prev.filter(c => c.id !== comment.id));
    setPost(prev => ({ ...prev, comment_count: Math.max(0, prev.comment_count - 1) }));
    await deleteComment(comment.id, post.id, theme.basePath);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed) return;

    setIsSubmittingComment(true);
    try {
      const formData = new FormData();
      formData.append("content", trimmed);
      formData.append("author", "Ziyaretçi Veli");
      formData.append("role", "Veli");

      await addComment(post.id, formData, theme.basePath);
      setComments(prev => [...prev, {
        id: `optimistic-${Date.now()}`,
        post_id: post.id,
        author: "Ziyaretçi Veli",
        role: "Veli",
        content: trimmed,
        created_at: new Date().toISOString(),
      }]);
      setPost(prev => ({ ...prev, comment_count: prev.comment_count + 1 }));
      setCommentText("");
    } catch (err) {
      console.error(err);
      alert("Yorum eklenirken bir hata oluştu.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-border shadow-sm sticky top-0 z-40">
        <Link href={theme.basePath} className="flex items-center gap-2 text-foreground/70 hover:text-foreground font-medium transition-colors">
          <ArrowLeft size={20} /> {theme.navLabel}
        </Link>
        <button
          onClick={handleDeletePost}
          title={`${theme.itemNoun} sil`}
          className="p-2 hover:bg-red-50 rounded-full transition-colors text-foreground/40 hover:text-red-600"
        >
          <Trash2 size={20} />
        </button>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-8">
        <div className="bg-white rounded-3xl overflow-hidden border border-border shadow-sm">
          <ImageGallery images={post.images} title={post.title} />

          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-bold leading-tight mb-3">{post.title}</h1>
              <div className="flex flex-wrap gap-2">
                {post.tags.map(tag => (
                  <span key={tag} className={`${theme.accentBgSoft} text-xs font-bold px-3 py-1 rounded-full ${theme.tagText}`}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${theme.accentBgSoft} flex items-center justify-center text-lg shadow-inner`}>
                  {post.role === 'Öğretmen' ? theme.teacherEmoji : theme.parentEmoji}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold leading-none">{post.author}</span>
                  <span className="text-xs text-foreground/50 mt-1">{post.role} · {formatRelativeTime(post.created_at)}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-foreground/40" title="Görüntülenme">
                  <Eye size={18} />
                  <span className="text-sm font-medium">{post.views}</span>
                </span>
                <span className="flex items-center gap-1.5 text-foreground/40" title="Yorum">
                  <MessageCircle size={18} />
                  <span className="text-sm font-medium">{comments.length}</span>
                </span>
                <button
                  onClick={handleLike}
                  disabled={hasLiked}
                  className="flex items-center gap-1.5 text-foreground/50 hover:text-pink-500 transition-colors disabled:cursor-default"
                >
                  <Heart size={20} className={hasLiked ? 'fill-pink-500 text-pink-500' : ''} />
                  <span className={`text-sm font-medium ${hasLiked ? 'text-pink-500' : ''}`}>{post.likes}</span>
                </button>
              </div>
            </div>

            <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">{post.content}</p>

            <div className="pt-4 border-t border-border">
              <h2 className="font-bold text-sm mb-4">Yorumlar ({comments.length})</h2>

              {comments.length === 0 ? (
                <p className="text-sm text-foreground/50 py-2">Henüz yorum yok. İlk yorumu sen yap!</p>
              ) : (
                <div className="space-y-4 mb-2">
                  {comments.map(comment => (
                    <div key={comment.id} className="flex items-start gap-3 group/comment">
                      <div className="w-8 h-8 shrink-0 rounded-full bg-surface flex items-center justify-center text-sm shadow-inner mt-0.5">
                        {comment.role === 'Öğretmen' ? theme.teacherEmoji : theme.parentEmoji}
                      </div>
                      <div className="flex-1 min-w-0 bg-surface rounded-2xl rounded-tl-sm px-4 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold">{comment.author}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-foreground/40">{formatRelativeTime(comment.created_at)}</span>
                            <button
                              onClick={() => handleDeleteComment(comment)}
                              title="Yorumu sil"
                              className="opacity-0 group-hover/comment:opacity-100 text-foreground/30 hover:text-red-600 transition-all"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-foreground/80 mt-1 whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmitComment} className="p-4 border-t border-border flex items-center gap-3">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Bir yorum yaz..."
              className={`flex-1 bg-surface border border-border rounded-full px-4 py-2.5 outline-none ${theme.accentBorderFocus} focus:ring-1 ${theme.accentRingFocus} text-sm`}
            />
            <button
              type="submit"
              disabled={isSubmittingComment || !commentText.trim()}
              className={`${theme.accentBg} text-white p-2.5 rounded-full ${theme.accentBgHover} transition-colors disabled:opacity-50 shrink-0`}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
