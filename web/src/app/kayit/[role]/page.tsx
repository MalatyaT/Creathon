import Link from "next/link";
import { notFound } from "next/navigation";
import { isPortalSlug, PORTALS } from "@/lib/roles";
import { RoleAuthForm } from "@/components/auth/role-auth-form";

export default async function KayitPage(props: PageProps<"/kayit/[role]">) {
  const { role } = await props.params;
  if (!isPortalSlug(role)) notFound();

  const portal = PORTALS[role];

  return (
    <div className="mx-auto flex min-h-full max-w-sm flex-col justify-center px-6 py-16">
      <Link href="/" className="mb-8 text-sm text-foreground/60 hover:text-foreground">
        ← İkiz
      </Link>
      <h1 className="font-heading text-2xl font-semibold">
        {portal.label} kaydı
      </h1>
      <p className="mt-1.5 text-sm text-foreground/65">{portal.tagline}</p>
      <div className="mt-8">
        <RoleAuthForm slug={role} mode="signup" />
      </div>
      <p className="mt-6 text-sm text-foreground/60">
        Zaten hesabın var mı?{" "}
        <Link href={`/giris/${role}`} className="font-medium text-brand-green">
          Giriş yap
        </Link>
      </p>
    </div>
  );
}
