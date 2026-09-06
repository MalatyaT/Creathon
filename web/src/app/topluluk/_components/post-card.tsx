"use client";

import { Heart, Eye, MessageCircle, FileText, Image as ImageIcon, Trash2 } from "lucide-react";
import type { CommunityPost } from "../actions";

type PostCardProps = {
  post: CommunityPost;
  hasLiked: boolean;
  onOpen: (post: CommunityPost) => void;
  onLike: (post: CommunityPost) => void;
  onDelete: (post: CommunityPost) => void;
};

export function PostCard({ post, hasLiked, onOpen, onLike, onDelete }: PostCardProps) {
  return (
    <div
      onClick={() => onOpen(post)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") onOpen(post); }}
      className="bg-white rounded-3xl overflow-hidden border border-border shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col cursor-pointer text-left"
    >
      {/* Image Thumbnail */}
      <div className="w-full relative bg-surface-muted aspect-[4/3] overflow-hidden">
        {post.image_base64 ? (
          post.image_base64.startsWith('data:application/pdf') ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-red-500 bg-red-50 group-hover:bg-red-100 transition-colors">
              <FileText size={48} className="mb-2" />
              <span className="font-bold text-sm">PDF Eki</span>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.image_base64} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-foreground/20">
            <ImageIcon size={48} />
          </div>
        )}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          {post.tags.map(tag => (
            <span key={tag} className="bg-white/90 backdrop-blur-sm text-xs font-bold px-3 py-1 rounded-full text-purple-700 shadow-sm">
              {tag}
            </span>
          ))}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(post); }}
          title="Etkinliği sil"
          className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-foreground/50 p-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-white transition-all"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-bold text-lg mb-2 line-clamp-2 leading-tight">{post.title}</h3>
        <p className="text-foreground/70 text-sm mb-4 line-clamp-3 flex-1">{post.content}</p>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 shrink-0 rounded-full bg-purple-100 flex items-center justify-center text-sm shadow-inner">
              {post.role === 'Öğretmen' ? '👩‍🏫' : '👩‍👦'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold leading-none truncate">{post.author}</span>
              <span className="text-[10px] text-foreground/50">{post.role}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="flex items-center gap-1 text-foreground/40" title="Görüntülenme">
              <Eye size={16} />
              <span className="text-xs font-medium">{post.views}</span>
            </span>
            <span className="flex items-center gap-1 text-foreground/40" title="Yorum">
              <MessageCircle size={16} />
              <span className="text-xs font-medium">{post.comment_count}</span>
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onLike(post); }}
              disabled={hasLiked}
              className="flex items-center gap-1.5 text-foreground/50 hover:text-pink-500 transition-colors disabled:cursor-default"
            >
              <Heart size={18} className={hasLiked ? 'fill-pink-500 text-pink-500' : ''} />
              <span className={`text-sm font-medium ${hasLiked ? 'text-pink-500' : ''}`}>{post.likes}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
