import { requireRole, supabaseConfigured } from "@/lib/auth-guard";
import { createClient } from "@/lib/supabase/server";
import { HomeworkList, type HomeworkItem } from "@/components/panel/homework-list";

export default async function OdevlerPage() {
  const { user, previewMode } = await requireRole("student", "/giris/ogrenci");

  let books: string[] = [];
  let items: HomeworkItem[] = [];

  if (!previewMode && supabaseConfigured() && user) {
    const supabase = await createClient();

    const { data: scans } = await supabase
      .from("scans")
      .select("book_title")
      .eq("status", "done")
      .not("book_title", "is", null)
      .limit(50);
    books = Array.from(new Set((scans ?? []).map((s) => s.book_title).filter(Boolean))) as string[];

    const { data: homeworkRows } = await supabase
      .from("homework")
      .select("id, title, question_ids, due_date, completed_at")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false });

    const allIds = Array.from(new Set((homeworkRows ?? []).flatMap((h) => h.question_ids ?? [])));
    const { data: questionRows } = allIds.length
      ? await supabase.from("questions").select("id, topic_label").in("id", allIds)
      : { data: [] as { id: string; topic_label: string | null }[] };

    const topicById = new Map((questionRows ?? []).map((q) => [q.id, q.topic_label ?? ""]));

    items = (homeworkRows ?? []).map((h) => {
      const count = h.question_ids?.length ?? 0;
      const firstTopic = h.question_ids?.[0] ? topicById.get(h.question_ids[0]) : "";
      return {
        id: h.id,
        title: h.title,
        detail: `${count} soru`,
        topic: firstTopic || "",
        due: h.due_date,
        done: Boolean(h.completed_at),
      };
    });
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-10 px-8 py-16">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Ödevler</h1>
        <p className="mt-1.5 max-w-xl text-sm text-foreground/65">
          Kaynak kitapların semantik olarak işlendi: her soru konusuna, kazanımına ve zorluğuna göre
          etiketli. Sorduğun soru veya zayıf konun, kitabın tam ilgili bölümüne ödev olarak dönüyor.
        </p>
      </div>

      {books.length > 0 && (
        <div>
          <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/50">
            İşlenmiş kaynaklar
          </div>
          <div className="flex flex-wrap gap-2">
            {books.map((b) => (
              <span
                key={b}
                className="rounded-full border border-border px-3 py-1 text-xs font-medium"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-2 font-heading text-lg font-semibold">Ödevlerin</h2>

        {items.length === 0 ? (
          <p className="text-sm text-foreground/50">
            Henüz bir ödevin yok — Soru Oluştur&apos;da bir test hazırlayıp &quot;Ödev olarak
            ata&quot;ya basabilirsin.
          </p>
        ) : (
          <HomeworkList items={items} />
        )}
      </div>
    </div>
  );
}
