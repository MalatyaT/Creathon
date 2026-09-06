"use client";

import Link from "next/link";
import { Heart, Eye, MessageCircle, FileText, Image as ImageIcon, Trash2, Images } from "lucide-react";
import type { CommunityPostSummary } from "@/lib/community/actions";
import type { CommunityTheme } from "@/lib/community/theme";

type PostCardProps = {
  post: CommunityPostSummary;
  theme: CommunityTheme;
  hasLiked: boolean;
  onLike: (post: CommunityPostSummary) => void;
  onDelete: (post: CommunityPostSummary) => void;
};

export function PostCard({ post, theme, hasLiked, onLike, onDelete }: PostCardProps) {
  return (
    <Link
      href={`${theme.basePath}/${post.id}`}
      className="bg-white rounded-3xl overflow-hidden border border-border shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col cursor-pointer text-left"
    >
      {/* Image Thumbnail */}
      <div className="w-full relative bg-surface-muted aspect-[4/3] overflow-hidden">
        {post.cover_is_pdf ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-red-500 bg-red-50 group-hover:bg-red-100 transition-colors">
            <FileText size={48} className="mb-2" />
            <span className="font-bold text-sm">PDF Eki</span>
          </div>
        ) : post.cover_thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.cover_thumbnail} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-foreground/20">
            <ImageIcon size={48} />
          </div>
        )}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          {post.tags.map(tag => (
            <span key={tag} className={`${theme.tagBg} backdrop-blur-sm text-xs font-bold px-3 py-1 rounded-full ${theme.tagText} shadow-sm`}>
              {tag}
            </span>
          ))}
        </div>
        {post.image_count > 1 && (
          <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <Images size={12} /> {post.image_count}
          </span>
        )}
        <button
          onClick={(e) => { e.preventDefault(); onDelete(post); }}
          title={`${theme.itemNoun} sil`}
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
            <div className={`w-8 h-8 shrink-0 rounded-full ${theme.accentBgSoft} flex items-center justify-center text-sm shadow-inner`}>
              {post.role === 'Öğretmen' ? theme.teacherEmoji : theme.parentEmoji}
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
              onClick={(e) => { e.preventDefault(); onLike(post); }}
              disabled={hasLiked}
              className="flex items-center gap-1.5 text-foreground/50 hover:text-pink-500 transition-colors disabled:cursor-default"
            >
              <Heart size={18} className={hasLiked ? 'fill-pink-500 text-pink-500' : ''} />
              <span className={`text-sm font-medium ${hasLiked ? 'text-pink-500' : ''}`}>{post.likes}</span>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
