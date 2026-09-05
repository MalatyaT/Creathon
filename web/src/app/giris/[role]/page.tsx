import Link from "next/link";
import { notFound } from "next/navigation";
import { isPortalSlug, PORTALS } from "@/lib/roles";
import { RoleAuthForm } from "@/components/auth/role-auth-form";

export default async function GirisPage(props: PageProps<"/giris/[role]">) {
  const { role } = await props.params;
  if (!isPortalSlug(role)) notFound();

  const portal = PORTALS[role];

  return (
    <div className="mx-auto flex min-h-full max-w-sm flex-col justify-center px-6 py-16">
      <Link href="/" className="mb-8 text-sm text-foreground/60 hover:text-foreground">
        ← İkiz
      </Link>
      <h1 className="font-heading text-2xl font-semibold">
        {portal.label} girişi
      </h1>
      <p className="mt-1.5 text-sm text-foreground/65">{portal.tagline}</p>
      <div className="mt-8">
        <RoleAuthForm slug={role} mode="login" />
      </div>
      <p className="mt-6 text-sm text-foreground/60">
        Hesabın yok mu?{" "}
        <Link href={`/kayit/${role}`} className="font-medium text-brand-violet">
          Kayıt ol
        </Link>
      </p>
    </div>
  );
}
