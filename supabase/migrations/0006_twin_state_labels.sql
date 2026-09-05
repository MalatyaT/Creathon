-- twin_state.topic_id şu an NOT NULL ve birincil anahtarın parçası, ama gerçek `topics`
-- taksonomisi henüz seed edilmedi (bkz. TODO.md). Chat/soru akışından gelen konu tahmini
-- (topic_label, serbest metin) ile risk skorunu güncelleyebilmek için topic_id'yi
-- nullable yapıp aynı serbest-metin desenini (questions/chat_messages'takiyle aynı) buraya
-- da ekliyoruz. Birincil anahtar artık sentetik bir id; (student_id, topic_label) ya da
-- (student_id, topic_id) üzerinden ayrı unique index'lerle upsert yapılabiliyor.

alter table twin_state drop constraint twin_state_pkey;
alter table twin_state add column id uuid primary key default gen_random_uuid();
alter table twin_state alter column topic_id drop not null;
alter table twin_state add column topic_label text;

create unique index twin_state_student_topic_label_uniq on twin_state (student_id, topic_label)
  where topic_id is null;
create unique index twin_state_student_topic_id_uniq on twin_state (student_id, topic_id)
  where topic_id is not null;

-- 0001'de sadece select policy'si vardı; öğrencinin kendi risk satırını yazabilmesi (chat'ten
-- sonraki upsert) için insert/update eksikti.
create policy "twin_state_writable_by_self" on twin_state for insert with check (student_id = auth.uid());
create policy "twin_state_updatable_by_self" on twin_state for update using (student_id = auth.uid());
