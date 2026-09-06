"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TwinMark } from "@/components/brand/twin-mark";
import { Search, Plus, Filter } from "lucide-react";
import { getCommunityPosts, likeCommunityPost, deleteCommunityPost, type CommunityPostSummary } from "@/lib/community/actions";
import type { CommunityTheme } from "@/lib/community/theme";
import { PostCard } from "./post-card";
import { UploadModal } from "./upload-modal";

function likedPostsKey(basePath: string) {
  return `community_liked_posts_${basePath}`;
}

function loadLikedPostIds(basePath: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(likedPostsKey(basePath));
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function CommunityListPage({ theme }: { theme: CommunityTheme }) {
  const [posts, setPosts] = useState<CommunityPostSummary[]>([]);
  const [activeTag, setActiveTag] = useState<string>("Tümü");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());

  const fetchPosts = async () => {
    const data = await getCommunityPosts(theme.category, activeTag === "Tümü" ? undefined : activeTag);
    setPosts(data);
  };

  const initLikedPostIds = async () => {
    setLikedPostIds(loadLikedPostIds(theme.basePath));
  };

  useEffect(() => {
    fetchPosts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTag]);

  useEffect(() => {
    initLikedPostIds();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLike = async (post: CommunityPostSummary) => {
    if (likedPostIds.has(post.id)) return;

    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes: p.likes + 1 } : p));
    const nextLiked = new Set(likedPostIds).add(post.id);
    setLikedPostIds(nextLiked);
    try {
      window.localStorage.setItem(likedPostsKey(theme.basePath), JSON.stringify(Array.from(nextLiked)));
    } catch {
      // ignore storage failures (e.g. private browsing)
    }

    await likeCommunityPost(post.id, theme.basePath);
  };

  const handleDeletePost = async (post: CommunityPostSummary) => {
    if (!window.confirm(`"${post.title}" ${theme.itemNoun.toLowerCase()}ini silmek istediğine emin misin?`)) return;
    setPosts(prev => prev.filter(p => p.id !== post.id));
    await deleteCommunityPost(post.id, theme.basePath);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      {/* Navbar */}
      <header className="flex flex-wrap items-center justify-between px-6 py-4 bg-white border-b border-border shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link href={theme.homeHref} className="flex items-center gap-2 hover:opacity-80 transition-opacity h-12 sm:h-16">
            <TwinMark variant={theme.twinMarkVariant} className="h-full" />
          </Link>
          <div className="h-6 w-px bg-border mx-2 hidden sm:block"></div>
          <span className="text-foreground/70 font-medium hidden sm:block">{theme.navLabel}</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowUploadModal(true)}
            className={`${theme.accentBg} text-white px-5 py-2.5 rounded-full font-semibold flex items-center gap-2 ${theme.accentBgHover} transition-all shadow-md hover:shadow-lg`}
          >
            <Plus size={18} />
            <span className="hidden sm:inline">{theme.uploadButtonLabel}</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-6 sm:p-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-heading font-bold text-foreground mb-3">{theme.heading}</h1>
            <p className="text-foreground/60 text-lg">{theme.subheading}</p>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" size={20} />
            <input
              type="text"
              placeholder={theme.searchPlaceholder}
              className={`w-full bg-white border border-border rounded-full py-3 pl-12 pr-4 outline-none ${theme.accentBorderFocus} focus:ring-2 ${theme.accentRingSoft} transition-all shadow-sm`}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-10">
          <span className="text-foreground/50 font-medium mr-2 flex items-center gap-2">
            <Filter size={18} /> Filtreler:
          </span>
          {theme.tags.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-5 py-2 rounded-full font-medium transition-all ${activeTag === tag ? 'bg-foreground text-background shadow-md' : 'bg-white text-foreground border border-border hover:border-foreground/30 hover:bg-surface'}`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Grid Feed */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-[max-content]">
          {posts.length === 0 && (
            <div className="col-span-full py-20 text-center text-foreground/50 text-lg">
              {theme.emptyMessage}
            </div>
          )}
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              theme={theme}
              hasLiked={likedPostIds.has(post.id)}
              onLike={handleLike}
              onDelete={handleDeletePost}
            />
          ))}
        </div>
      </main>

      {showUploadModal && (
        <UploadModal theme={theme} onClose={() => setShowUploadModal(false)} onCreated={fetchPosts} />
      )}
    </div>
  );
}
