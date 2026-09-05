export type PortalSlug = "ogrenci" | "ogretmen" | "kaynak-uretici";
export type UserRole = "student" | "teacher" | "parent" | "content_creator";

export const PORTALS: Record<
  PortalSlug,
  {
    role: UserRole;
    label: string;
    tagline: string;
    dashboardPath: string;
  }
> = {
  ogrenci: {
    role: "student",
    label: "Öğrenci",
    tagline: "İkizini büyüt, riskini gör, LGS/YKS'ye hazırlan.",
    dashboardPath: "/panel",
  },
  ogretmen: {
    role: "teacher",
    label: "Öğretmen",
    tagline: "Sınıfının risk haritasını izle, ödev ata, havuzu onayla.",
    dashboardPath: "/ogretmen",
  },
  "kaynak-uretici": {
    role: "content_creator",
    label: "Kaynak Üreticisi",
    tagline: "Kitapları tara, soru havuzunu büyüt.",
    dashboardPath: "/kaynak-uretici",
  },
};

export const PORTAL_SLUGS = Object.keys(PORTALS) as PortalSlug[];

export function isPortalSlug(value: string): value is PortalSlug {
  return PORTAL_SLUGS.includes(value as PortalSlug);
}
