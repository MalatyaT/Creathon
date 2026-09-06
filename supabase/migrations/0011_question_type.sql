-- Çoktan seçmeli/açık uçlu ayrımını kalıcı hale getirmek için (bkz. yeni soru üretimi
-- şeması, lib/schemas/generation.ts). Var olan tüm sorular (OCR ile taranmış gerçek
-- TYT/KPSS sınavları) gerçekte hep çoktan seçmeli olduğu için varsayılan buna göre.
alter table questions add column question_type text not null default 'multiple_choice'
  check (question_type in ('multiple_choice', 'open_ended'));
