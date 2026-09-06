"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// Initialize Supabase admin client (since we're server side, we can bypass RLS or just use public anon key)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export type CommunityPost = {
  id: string;
  title: string;
  content: string;
  author: string;
  role: string;
  tags: string[];
  image_base64?: string;
  likes: number;
  created_at: string;
};

export async function getCommunityPosts(tagFilter?: string): Promise<CommunityPost[]> {
  let query = supabase
    .from("community_posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (tagFilter) {
    query = query.contains("tags", [tagFilter]);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching community posts:", error);
    return [];
  }
  return data as CommunityPost[];
}

export async function createCommunityPost(formData: FormData) {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const image_base64 = formData.get("image_base64") as string; // Optional
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
      image_base64: image_base64 || null
    });

  if (error) {
    console.error("Error creating post:", error);
    throw new Error("Failed to create post");
  }

  revalidatePath("/topluluk-egitim");
}

export async function likeCommunityPost(postId: string) {
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
      
    revalidatePath("/topluluk-egitim");
  }
}
