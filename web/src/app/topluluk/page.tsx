"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TwinMark } from "@/components/brand/twin-mark";
import { Search, Plus, Filter } from "lucide-react";
import {
  getCommunityPosts,
  likeCommunityPost,
  deleteCommunityPost,
  incrementPostView,
  getComments,
  addComment,
  deleteComment,
  type CommunityPost,
  type CommunityComment,
} from "./actions";
import { PostCard } from "./_components/post-card";
import { PostDetailModal } from "./_components/post-detail-modal";
import { UploadModal } from "./_components/upload-modal";

const LIKED_POSTS_KEY = "topluluk_liked_posts";

function loadLikedPostIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(LIKED_POSTS_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export default function ToplulukLibrary() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [activeTag, setActiveTag] = useState<string>("Tümü");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());

  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const allTags = ["Tümü", "Doğa", "Matematik", "Motor Beceriler", "Eğitici Oyun", "Sanat"];

  const fetchPosts = async () => {
    const data = await getCommunityPosts(activeTag === "Tümü" ? undefined : activeTag);
    setPosts(data);
  };

  const initLikedPostIds = async () => {
    setLikedPostIds(loadLikedPostIds());
  };

  useEffect(() => {
    fetchPosts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTag]);

  useEffect(() => {
    initLikedPostIds();
  }, []);

  const persistLikedPostIds = (ids: Set<string>) => {
    setLikedPostIds(ids);
    try {
      window.localStorage.setItem(LIKED_POSTS_KEY, JSON.stringify(Array.from(ids)));
    } catch {
      // ignore storage failures (e.g. private browsing)
    }
  };

  const handleLike = async (post: CommunityPost) => {
    if (likedPostIds.has(post.id)) return;

    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes: p.likes + 1 } : p));
    setSelectedPost(prev => prev && prev.id === post.id ? { ...prev, likes: prev.likes + 1 } : prev);
    persistLikedPostIds(new Set(likedPostIds).add(post.id));

    await likeCommunityPost(post.id);
  };

  const handleDeletePost = async (post: CommunityPost) => {
    if (!window.confirm(`"${post.title}" etkinliğini silmek istediğine emin misin?`)) return;

    setPosts(prev => prev.filter(p => p.id !== post.id));
    setSelectedPost(prev => prev && prev.id === post.id ? null : prev);

    await deleteCommunityPost(post.id);
  };

  const openPostDetail = async (post: CommunityPost) => {
    setSelectedPost(post);
    setComments([]);

    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, views: p.views + 1 } : p));
    setSelectedPost(prev => prev && prev.id === post.id ? { ...prev, views: prev.views + 1 } : prev);

    const [postComments] = await Promise.all([
      getComments(post.id),
      incrementPostView(post.id),
    ]);
    setComments(postComments);
  };

  const closeDetail = () => {
    setSelectedPost(null);
    setComments([]);
  };

  const handleSubmitComment = async (content: string) => {
    if (!selectedPost) return;
    setIsSubmittingComment(true);
    try {
      const formData = new FormData();
      formData.append("content", content);
      formData.append("author", "Ziyaretçi Veli");
      formData.append("role", "Veli");

      await addComment(selectedPost.id, formData);
      const updatedComments = await getComments(selectedPost.id);
      setComments(updatedComments);
      setPosts(prev => prev.map(p => p.id === selectedPost.id ? { ...p, comment_count: updatedComments.length } : p));
    } catch (err) {
      console.error(err);
      alert("Yorum eklenirken bir hata oluştu.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (comment: CommunityComment) => {
    if (!selectedPost) return;
    setComments(prev => prev.filter(c => c.id !== comment.id));
    setPosts(prev => prev.map(p => p.id === selectedPost.id ? { ...p, comment_count: Math.max(0, p.comment_count - 1) } : p));

    await deleteComment(comment.id);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      {/* Navbar */}
      <header className="flex flex-wrap items-center justify-between px-6 py-4 bg-white border-b border-border shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity h-12 sm:h-16">
            <TwinMark variant="cocuk" className="h-full" />
          </Link>
          <div className="h-6 w-px bg-border mx-2 hidden sm:block"></div>
          <span className="text-foreground/70 font-medium hidden sm:block">Etkinlik Kütüphanesi</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-purple-600 text-white px-5 py-2.5 rounded-full font-semibold flex items-center gap-2 hover:bg-purple-700 transition-all shadow-md hover:shadow-lg"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Yeni Etkinlik Ekle</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-6 sm:p-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-heading font-bold text-foreground mb-3">Keşfet</h1>
            <p className="text-foreground/60 text-lg">Öğretmenlerimizin ve velilerimizin harika etkinlik dünyasına hoş geldiniz.</p>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" size={20} />
            <input
              type="text"
              placeholder="Etkinlik ara..."
              className="w-full bg-white border border-border rounded-full py-3 pl-12 pr-4 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-10">
          <span className="text-foreground/50 font-medium mr-2 flex items-center gap-2">
            <Filter size={18} /> Filtreler:
          </span>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-5 py-2 rounded-full font-medium transition-all ${activeTag === tag ? 'bg-foreground text-background shadow-md' : 'bg-white text-foreground border border-border hover:border-foreground/30 hover:bg-surface'}`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Masonry/Grid Feed */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-[max-content]">
          {posts.length === 0 && (
            <div className="col-span-full py-20 text-center text-foreground/50 text-lg">
              Henüz bu kategoride etkinlik paylaşılmamış. İlk paylaşan siz olun!
            </div>
          )}
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              hasLiked={likedPostIds.has(post.id)}
              onOpen={openPostDetail}
              onLike={handleLike}
              onDelete={handleDeletePost}
            />
          ))}
        </div>
      </main>

      {showUploadModal && (
        <UploadModal onClose={() => setShowUploadModal(false)} onCreated={fetchPosts} />
      )}

      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          comments={comments}
          hasLiked={likedPostIds.has(selectedPost.id)}
          isSubmittingComment={isSubmittingComment}
          onClose={closeDetail}
          onLike={handleLike}
          onDeletePost={handleDeletePost}
          onDeleteComment={handleDeleteComment}
          onSubmitComment={handleSubmitComment}
        />
      )}
    </div>
  );
}
