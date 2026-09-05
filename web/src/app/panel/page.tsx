import { requireRole } from "@/lib/auth-guard";

export default async function PanelPage() {
  const { profile } = await requireRole("student", "/giris/ogrenci");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-8 py-16">
      <h1 className="font-heading text-2xl font-semibold">
        Merhaba {profile.full_name || "öğrenci"}
      </h1>
      <p className="text-foreground/65">
        Öğrenci paneli burada büyüyecek: Ödevler, Videolar.
      </p>
    </div>
  );
}
