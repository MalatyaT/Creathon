import Link from "next/link";
import { requireRole } from "@/lib/auth-guard";
import { Chat } from "@/components/panel/chat";

export default async function SoruSorPage() {
  await requireRole("student", "/giris/ogrenci");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-16">
      <div>
        <Link href="/panel" className="text-sm text-foreground/60 hover:text-foreground">
          ← Panel
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-semibold">Soru Sor</h1>
      </div>
      <Chat />
    </div>
  );
}
