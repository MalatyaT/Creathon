"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// Initialize Supabase admin client (since we're server side, we can bypass RLS or just use public anon key)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export type CommunityCategory = "anaokulu" | "egitim";

// Lean shape for grid/list views — carries only a small pre-generated
// thumbnail instead of the full (often multi-hundred-KB) attachment data,
// which used to make the list query pull several MB for a handful of posts.
export type CommunityPostSummary = {
  id: string;
  title: string;
  content: string;
  author: string;
  role: string;
  tags: string[];
  category: CommunityCategory;
  cover_thumbnail: string | null;
  cover_is_pdf: boolean;
  image_count: number;
  likes: number;
  views: number;
  comment_count: number;
  created_at: string;
};

export type CommunityPost = CommunityPostSummary & {
  image_base64?: string;
  images: string[];
};

export type CommunityComment = {
  id: string;
  post_id: string;
  author: string;
  role: string;
  content: string;
  created_at: string;
};

function postImages(post: { images?: string[] | null; image_base64?: string | null }): string[] {
  if (post.images && post.images.length > 0) return post.images;
  return post.image_base64 ? [post.image_base64] : [];
}

const SUMMARY_COLUMNS = "id,title,content,author,role,tags,category,cover_thumbnail,cover_is_pdf,image_count,likes,views,created_at";

export async function getCommunityPosts(category: CommunityCategory, tagFilter?: string): Promise<CommunityPostSummary[]> {
  let query = supabase
    .from("community_posts")
    .select(`${SUMMARY_COLUMNS}, community_post_comments(count)`)
    .eq("category", category)
    .order("created_at", { ascending: false });

  if (tagFilter) {
    query = query.contains("tags", [tagFilter]);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching community posts:", error);
    return [];
  }

  return (data ?? []).map((row) => {
    const { community_post_comments, ...post } = row as CommunityPostSummary & {
      community_post_comments: { count: number }[];
    };
    return {
      ...post,
      comment_count: community_post_comments?.[0]?.count ?? 0,
    };
  });
}

export async function getPostById(postId: string): Promise<CommunityPost | null> {
  const { data, error } = await supabase
    .from("community_posts")
    .select("*, community_post_comments(count)")
    .eq("id", postId)
    .single();

  if (error || !data) {
    console.error("Error fetching community post:", error);
    return null;
  }

  const { community_post_comments, ...post } = data as CommunityPost & {
    community_post_comments: { count: number }[];
  };
  return {
    ...post,
    images: postImages(post),
    comment_count: community_post_comments?.[0]?.count ?? 0,
  };
}

export async function createCommunityPost(formData: FormData, category: CommunityCategory, basePath: string) {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const images = formData.getAll("images").filter(Boolean) as string[];
  const coverThumbnail = (formData.get("cover_thumbnail") as string) || null;
  const coverIsPdf = formData.get("cover_is_pdf") === "true";
  const tagsString = formData.get("tags") as string; // Comma separated
  const author = formData.get("author") as string || "Ziyaretçi Veli";
  const role = formData.get("role") as string || "Veli";

  if (!title || !content) {
    throw new Error("Title and content are required.");
  }

  const tags = tagsString ? tagsString.split(",").map(t => t.trim()).filter(Boolean) : [];

  const { error } = await supabase
    .from("community_posts")
    .insert({
      title,
      content,
      author,
      role,
      tags,
      images,
      category,
      cover_thumbnail: coverThumbnail,
      cover_is_pdf: coverIsPdf,
      image_count: images.length,
    });

  if (error) {
    console.error("Error creating post:", error);
    throw new Error("Failed to create post");
  }

  revalidatePath(basePath);
}

export async function deleteCommunityPost(postId: string, basePath: string) {
  const { error } = await supabase
    .from("community_posts")
    .delete()
    .eq("id", postId);

  if (error) {
    console.error("Error deleting post:", error);
    throw new Error("Failed to delete post");
  }

  revalidatePath(basePath);
}

export async function likeCommunityPost(postId: string, basePath: string) {
  // Simple like increment, not strictly atomic/idempotent but fine for demo
  const { data: post } = await supabase
    .from("community_posts")
    .select("likes")
    .eq("id", postId)
    .single();

  if (post) {
    await supabase
      .from("community_posts")
      .update({ likes: post.likes + 1 })
      .eq("id", postId);

    revalidatePath(basePath);
    revalidatePath(`${basePath}/${postId}`);
  }
}

export async function incrementPostView(postId: string) {
  // Simple view increment, not strictly atomic but fine for demo
  const { data: post } = await supabase
    .from("community_posts")
    .select("views")
    .eq("id", postId)
    .single();

  if (post) {
    await supabase
      .from("community_posts")
      .update({ views: post.views + 1 })
      .eq("id", postId);
  }
}

export async function getComments(postId: string): Promise<CommunityComment[]> {
  const { data, error } = await supabase
    .from("community_post_comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching comments:", error);
    return [];
  }
  return data as CommunityComment[];
}

export async function addComment(postId: string, formData: FormData, basePath: string) {
  const content = (formData.get("content") as string || "").trim();
  const author = (formData.get("author") as string) || "Ziyaretçi Veli";
  const role = (formData.get("role") as string) || "Veli";

  if (!content) {
    throw new Error("Comment content is required.");
  }

  const { error } = await supabase
    .from("community_post_comments")
    .insert({ post_id: postId, author, role, content });

  if (error) {
    console.error("Error adding comment:", error);
    throw new Error("Failed to add comment");
  }

  revalidatePath(`${basePath}/${postId}`);
}

export async function deleteComment(commentId: string, postId: string, basePath: string) {
  const { error } = await supabase
    .from("community_post_comments")
    .delete()
    .eq("id", commentId);

  if (error) {
    console.error("Error deleting comment:", error);
    throw new Error("Failed to delete comment");
  }

  revalidatePath(`${basePath}/${postId}`);
}
