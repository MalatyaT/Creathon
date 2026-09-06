"use client";

import { useState } from "react";
import { Heart, Eye, MessageCircle, FileText, Image as ImageIcon, Trash2, X, Send } from "lucide-react";
import { formatRelativeTime } from "@/lib/format-relative-time";
import type { CommunityComment, CommunityPost } from "../actions";

type PostDetailModalProps = {
  post: CommunityPost;
  comments: CommunityComment[];
  hasLiked: boolean;
  isSubmittingComment: boolean;
  onClose: () => void;
  onLike: (post: CommunityPost) => void;
  onDeletePost: (post: CommunityPost) => void;
  onDeleteComment: (comment: CommunityComment) => void;
  onSubmitComment: (content: string) => Promise<void>;
};

export function PostDetailModal({
  post,
  comments,
  hasLiked,
  isSubmittingComment,
  onClose,
  onLike,
  onDeletePost,
  onDeleteComment,
  onSubmitComment,
}: PostDetailModalProps) {
  const [commentText, setCommentText] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed) return;
    await onSubmitComment(trimmed);
    setCommentText("");
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-border shrink-0">
          <div className="min-w-0 pr-4">
            <h2 className="text-2xl font-bold font-heading leading-tight">{post.title}</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              {post.tags.map(tag => (
                <span key={tag} className="bg-purple-50 text-xs font-bold px-3 py-1 rounded-full text-purple-700">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onDeletePost(post)}
              title="Etkinliği sil"
              className="p-2 hover:bg-red-50 rounded-full transition-colors text-foreground/40 hover:text-red-600"
            >
              <Trash2 size={20} />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-surface rounded-full transition-colors text-foreground/50 hover:text-foreground">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">
          {/* Media */}
          <div className="w-full bg-surface-muted max-h-80 flex items-center justify-center overflow-hidden">
            {post.image_base64 ? (
              post.image_base64.startsWith('data:application/pdf') ? (
                <a href={post.image_base64} download={`${post.title}.pdf`} className="w-full py-10 flex flex-col items-center justify-center text-red-500 bg-red-50 hover:bg-red-100 transition-colors">
                  <FileText size={48} className="mb-2" />
                  <span className="font-bold text-sm underline">PDF İndir</span>
                </a>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.image_base64} alt={post.title} className="w-full max-h-80 object-contain" />
              )
            ) : (
              <div className="w-full h-40 flex items-center justify-center text-foreground/20">
                <ImageIcon size={48} />
              </div>
            )}
          </div>

          <div className="p-6 space-y-6">
            {/* Author + stats */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-lg shadow-inner">
                  {post.role === 'Öğretmen' ? '👩‍🏫' : '👩‍👦'}
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
                  onClick={() => onLike(post)}
                  disabled={hasLiked}
                  className="flex items-center gap-1.5 text-foreground/50 hover:text-pink-500 transition-colors disabled:cursor-default"
                >
                  <Heart size={20} className={hasLiked ? 'fill-pink-500 text-pink-500' : ''} />
                  <span className={`text-sm font-medium ${hasLiked ? 'text-pink-500' : ''}`}>{post.likes}</span>
                </button>
              </div>
            </div>

            {/* Content */}
            <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">{post.content}</p>

            {/* Comments */}
            <div className="pt-4 border-t border-border">
              <h3 className="font-bold text-sm mb-4">Yorumlar ({comments.length})</h3>

              {comments.length === 0 ? (
                <p className="text-sm text-foreground/50 py-2">Henüz yorum yok. İlk yorumu sen yap!</p>
              ) : (
                <div className="space-y-4 mb-2">
                  {comments.map(comment => (
                    <div key={comment.id} className="flex items-start gap-3 group/comment">
                      <div className="w-8 h-8 shrink-0 rounded-full bg-surface flex items-center justify-center text-sm shadow-inner mt-0.5">
                        {comment.role === 'Öğretmen' ? '👩‍🏫' : '👩‍👦'}
                      </div>
                      <div className="flex-1 min-w-0 bg-surface rounded-2xl rounded-tl-sm px-4 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold">{comment.author}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-foreground/40">{formatRelativeTime(comment.created_at)}</span>
                            <button
                              onClick={() => onDeleteComment(comment)}
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
        </div>

        {/* Comment form */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-border shrink-0 flex items-center gap-3">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Bir yorum yaz..."
            className="flex-1 bg-surface border border-border rounded-full px-4 py-2.5 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
          />
          <button
            type="submit"
            disabled={isSubmittingComment || !commentText.trim()}
            className="bg-purple-600 text-white p-2.5 rounded-full hover:bg-purple-700 transition-colors disabled:opacity-50 shrink-0"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
