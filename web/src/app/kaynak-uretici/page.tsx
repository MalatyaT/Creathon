import { requireRole } from "@/lib/auth-guard";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ScanUpload } from "@/components/kaynak-uretici/scan-upload";

export default async function KaynakUreticiPage() {
  const { profile } = await requireRole(
    "content_creator",
    "/giris/kaynak-uretici",
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">
            Merhaba {profile.full_name || "kaynak üreticisi"}
          </h1>
          <p className="mt-1 text-sm text-foreground/65">
            Kitap sayfası yükle, Gemini soruları ayırsın, gözden geçirip
            havuza ekle.
          </p>
        </div>
        <SignOutButton />
      </div>

      <ScanUpload />
    </div>
  );
}
