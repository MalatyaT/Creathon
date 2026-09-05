import { requireRole } from "@/lib/auth-guard";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default async function OgretmenPage() {
  const { profile } = await requireRole("teacher", "/giris/ogretmen");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-6 py-16">
      <h1 className="font-heading text-2xl font-semibold">
        Merhaba {profile.full_name || "öğretmen"}
      </h1>
      <p className="text-foreground/65">
        Öğretmen paneli burada büyüyecek: sınıf risk haritası, ödev atama,
        soru havuzu onayı.
      </p>
      <div>
        <SignOutButton />
      </div>
    </div>
  );
}
