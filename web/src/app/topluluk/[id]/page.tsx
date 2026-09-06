import { notFound } from "next/navigation";
import { getComments, getPostById } from "@/lib/community/actions";
import { anaokuluTheme } from "@/lib/community/theme";
import { PostDetailView } from "@/components/community/post-detail-view";

export default async function ToplulukDetailPage(props: PageProps<"/topluluk/[id]">) {
  const { id } = await props.params;
  const post = await getPostById(id);
  if (!post) notFound();

  const comments = await getComments(id);

  return <PostDetailView theme={anaokuluTheme} initialPost={post} initialComments={comments} />;
}
