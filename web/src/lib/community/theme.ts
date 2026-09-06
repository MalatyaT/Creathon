import type { CommunityCategory } from "./actions";

export type CommunityTheme = {
  basePath: "/topluluk" | "/topluluk-egitim";
  category: CommunityCategory;
  homeHref: string;
  twinMarkVariant: "cocuk" | "egitim";
  navLabel: string;
  heading: string;
  subheading: string;
  searchPlaceholder: string;
  tags: string[];
  emptyMessage: string;
  itemNoun: string; // "Etkinlik" | "Kaynak"
  uploadButtonLabel: string;
  uploadModalTitle: string;
  titleFieldLabel: string;
  titleFieldPlaceholder: string;
  contentFieldLabel: string;
  contentFieldPlaceholder: string;
  teacherEmoji: string;
  parentEmoji: string;
  // Literal Tailwind class strings (kept whole so the compiler can find them).
  accentBg: string;
  accentBgHover: string;
  accentText: string;
  accentBorderFocus: string;
  accentRingFocus: string;
  accentRingSoft: string;
  accentBgSoft: string;
  accentHoverText: string;
  accentHoverBorder: string;
  tagBg: string;
  tagText: string;
};

export const anaokuluTheme: CommunityTheme = {
  basePath: "/topluluk",
  category: "anaokulu",
  homeHref: "/",
  twinMarkVariant: "cocuk",
  navLabel: "Etkinlik Kütüphanesi",
  heading: "Keşfet",
  subheading: "Öğretmenlerimizin ve velilerimizin harika etkinlik dünyasına hoş geldiniz.",
  searchPlaceholder: "Etkinlik ara...",
  tags: ["Tümü", "Doğa", "Matematik", "Motor Beceriler", "Eğitici Oyun", "Sanat"],
  emptyMessage: "Henüz bu kategoride etkinlik paylaşılmamış. İlk paylaşan siz olun!",
  itemNoun: "Etkinlik",
  uploadButtonLabel: "Yeni Etkinlik Ekle",
  uploadModalTitle: "Yeni Etkinlik Paylaş",
  titleFieldLabel: "Etkinlik Başlığı",
  titleFieldPlaceholder: "Örn: Evde Renk Avı Oyunu",
  contentFieldLabel: "Açıklama / Deneyim",
  contentFieldPlaceholder: "Etkinliği nasıl yaptınız? Çocuklar nasıl tepki verdi? İhtiyaç duyulan malzemeleri de ekleyebilirsiniz.",
  teacherEmoji: "👩‍🏫",
  parentEmoji: "👩‍👦",
  accentBg: "bg-purple-600",
  accentBgHover: "hover:bg-purple-700",
  accentText: "text-purple-700",
  accentBorderFocus: "focus:border-purple-500",
  accentRingFocus: "focus:ring-purple-500",
  accentRingSoft: "focus:ring-purple-200",
  accentBgSoft: "bg-purple-100",
  accentHoverText: "hover:text-purple-600",
  accentHoverBorder: "hover:border-purple-400",
  tagBg: "bg-white/90",
  tagText: "text-purple-700",
};

export const egitimTheme: CommunityTheme = {
  basePath: "/topluluk-egitim",
  category: "egitim",
  homeHref: "/panel/ogrenci",
  twinMarkVariant: "egitim",
  navLabel: "Eğitim Kütüphanesi",
  heading: "Keşfet",
  subheading: "Öğretmenlerimizin ve öğrencilerimizin paylaştığı ders notları, soru çözümleri ve taktikler.",
  searchPlaceholder: "Soru, not veya konu ara...",
  tags: ["Tümü", "TYT", "AYT", "LGS", "Matematik", "Fizik", "Ders Notu", "Soru Çözümü"],
  emptyMessage: "Henüz bu kategoride kaynak paylaşılmamış. İlk paylaşan siz olun!",
  itemNoun: "Kaynak",
  uploadButtonLabel: "Yeni Kaynak Ekle",
  uploadModalTitle: "Yeni Kaynak Paylaş",
  titleFieldLabel: "Başlık",
  titleFieldPlaceholder: "Örn: 2024 YKS Matematik Denemesi Zor Sorular",
  contentFieldLabel: "Açıklama / Soru Çözümü",
  contentFieldPlaceholder: "Soru çözümü veya notlarınızı buraya ekleyin...",
  teacherEmoji: "👨‍🏫",
  parentEmoji: "👨‍🎓",
  accentBg: "bg-brand-green",
  accentBgHover: "hover:bg-brand-green-600",
  accentText: "text-brand-green",
  accentBorderFocus: "focus:border-brand-green",
  accentRingFocus: "focus:ring-brand-green",
  accentRingSoft: "focus:ring-brand-green/20",
  accentBgSoft: "bg-brand-green/10",
  accentHoverText: "hover:text-brand-green",
  accentHoverBorder: "hover:border-brand-green",
  tagBg: "bg-white/90",
  tagText: "text-brand-green",
};
