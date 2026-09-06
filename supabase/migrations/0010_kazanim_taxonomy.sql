-- Gerçek kazanım taksonomisi altyapısı: subjects/topics tabloları şemada duruyordu ama
-- hiç doldurulmamıştı (bkz. TODO.md, migration 0003/0006 yorumları). Soru üretiminin
-- gerçekten farklı kazanımlara yayılabilmesi için bu tabloları kullanıma açıyoruz.
--
-- topics.aliases: elimizdeki 377 onaylı sorunun topic_label'ları (Biyoloji'de 176 varyant
-- gibi) neredeyse birebir aynı kazanımın farklı yazımları — kanonik kazanım adına ek olarak
-- ham varyantları burada tutup havuz sorgusunu (topic_id + eski topic_label satırları) her
-- ikisiyle de eşleştirebilelim diye ekleniyor. Gerçek kazanım verisi (topics satırları) ayrı
-- bir authoring+kullanıcı-onayı adımıyla doldurulacak (bkz. plan) — bu migration sadece
-- altyapı + sabit 4 dersi ekliyor.

alter table topics add column aliases text[] not null default '{}';

alter table subjects enable row level security;
alter table topics enable row level security;

create policy "subjects_public_read" on subjects for select using (true);
create policy "topics_public_read" on topics for select using (true);

insert into subjects (name, program) values
  ('Biyoloji', 'yks'),
  ('Matematik', 'yks'),
  ('Kimya', 'yks'),
  ('Coğrafya', 'yks');
