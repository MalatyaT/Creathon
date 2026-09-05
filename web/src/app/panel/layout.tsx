import { requireRole } from "@/lib/auth-guard";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { TwinMark } from "@/components/brand/twin-mark";
import { PanelNav } from "@/components/panel/panel-nav";

export default async function PanelLayout({ children }: LayoutProps<"/panel">) {
  const { profile } = await requireRole("student", "/giris/ogrenci");

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-none flex-col gap-8 border-r border-border bg-surface px-6 py-8">
        <div>
          <div className="flex items-center gap-2">
            <TwinMark />
            <span className="font-heading text-lg font-semibold">İkiz</span>
          </div>
          <p className="mt-2 text-xs text-foreground/50">
            Merhaba {profile.full_name || "öğrenci"}
          </p>
        </div>

        <PanelNav />

        <div className="mt-auto">
          <SignOutButton />
        </div>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
