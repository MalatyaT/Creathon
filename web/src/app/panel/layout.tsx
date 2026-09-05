export default function PanelLayout({ children }: { children: React.ReactNode }) {
  // Demo sunumu için auth kontrolü ve varsayılan panel tasarımı (sidebar) kaldırıldı.
  // Öğrenci paneli sayfası (panel/ogrenci/page.tsx) kendi sidebar'ını barındırmaktadır.
  return <>{children}</>;
}
