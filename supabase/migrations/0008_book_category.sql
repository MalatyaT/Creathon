-- Kaynak kitapları TYT/AYT/LGS/KPSS ya da 1-12. sınıf / üniversite eksenine göre
-- sınıflandırmak için (bkz. TODO.md Faz 2 "sınıf/ders taksonomisi" eksiği).
-- exam_program (yks/lgs, students/subjects tablolarında kullanılıyor) enum'una
-- dokunmuyoruz — mevcut kod yollarını bozmamak için ayrı, bağımsız bir enum.

create type book_category as enum (
  'tyt', 'ayt', 'lgs', 'kpss',
  'sinif_1', 'sinif_2', 'sinif_3', 'sinif_4', 'sinif_5', 'sinif_6',
  'sinif_7', 'sinif_8', 'sinif_9', 'sinif_10', 'sinif_11', 'sinif_12',
  'universite'
);

alter table scans add column category book_category;
alter table scans add column subject_name text;

-- Sorular kendi kaynağından (scans) bağımsız da filtrelenebilsin diye (source_scan_id
-- join gerektirmeden) kategori/ders adı burada da tekrarlanıyor, taramadan miras alınıyor.
alter table questions add column category book_category;
alter table questions add column subject_name text;
