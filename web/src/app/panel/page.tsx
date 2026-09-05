import Link from "next/link";
import { requireRole } from "@/lib/auth-guard";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default async function PanelPage() {
  const { profile } = await requireRole("student", "/giris/ogrenci");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">
          Merhaba {profile.full_name || "öğrenci"}
        </h1>
        <SignOutButton />
      </div>
      <p className="text-foreground/65">
        Öğrenci paneli burada büyüyecek: Ödevler, Videolar, Analiz.
      </p>
      <div className="mt-2 flex flex-wrap gap-3">
        <Link
          href="/panel/soru-sor"
          className="inline-block w-fit rounded-full bg-brand-violet px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-violet-600"
        >
          Bota soru sor
        </Link>
        <Link
          href="/panel/ikiz"
          className="inline-block w-fit rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-surface-muted"
        >
          Dijital İkiz
        </Link>
        <Link
          href="/panel/soru-olustur"
          className="inline-block w-fit rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-surface-muted"
        >
          Soru Oluştur
        </Link>
      </div>
    </div>
  );
}
