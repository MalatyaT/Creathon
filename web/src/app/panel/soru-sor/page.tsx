import { requireRole } from "@/lib/auth-guard";
import { Chat } from "@/components/panel/chat";

export default async function SoruSorPage() {
  await requireRole("student", "/giris/ogrenci");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-8 py-16">
      <h1 className="font-heading text-2xl font-semibold">Soru Sor</h1>
      <Chat />
    </div>
  );
}
