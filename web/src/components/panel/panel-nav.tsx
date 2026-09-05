"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/panel", label: "Panel" },
  { href: "/panel/ikiz", label: "Dijital İkiz" },
  { href: "/panel/soru-sor", label: "Soru Sor" },
  { href: "/panel/soru-olustur", label: "Soru Oluştur" },
  { href: "/panel/odevler", label: "Ödevler" },
  { href: "/panel/analiz", label: "Analiz" },
  { href: "/panel/videolar", label: "Videolar" },
];

export function PanelNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-brand-green text-white"
                : "text-foreground/70 hover:bg-surface-muted hover:text-foreground"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
