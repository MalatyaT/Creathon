import { notFound } from "next/navigation";
import { getComments, getPostById } from "@/lib/community/actions";
import { egitimTheme } from "@/lib/community/theme";
import { PostDetailView } from "@/components/community/post-detail-view";

export default async function ToplulukEgitimDetailPage(props: PageProps<"/topluluk-egitim/[id]">) {
  const { id } = await props.params;
  const post = await getPostById(id);
  if (!post) notFound();

  const comments = await getComments(id);

  return <PostDetailView theme={egitimTheme} initialPost={post} initialComments={comments} />;
}
