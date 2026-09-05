import { requireRole } from "@/lib/auth-guard";
import { listTopicsAction } from "./actions";
import { TestBuilder } from "@/components/panel/test-builder";

export default async function SoruOlusturPage() {
  await requireRole("student", "/giris/ogrenci");
  const topics = await listTopicsAction();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-8 py-16">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Soru Oluştur</h1>
        <p className="mt-1.5 max-w-xl text-sm text-foreground/65">
          Havuzdaki sorulara ve ikizinin hata desenine bakarak yeni bir test yazılır.
        </p>
      </div>

      <TestBuilder topics={topics} />
    </div>
  );
}
