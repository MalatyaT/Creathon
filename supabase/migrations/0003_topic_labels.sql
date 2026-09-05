-- Gemini, taranan sorulara ve sohbet yanıtlarına bir konu/kazanım tahmini (serbest metin)
-- döndürüyor. Gerçek `topics` taksonomisi henüz doldurulmadığı için (bkz. TODO.md Faz 1)
-- bu tahmini `topic_id` FK'sinden ayrı, serbest metin bir sütunda tutuyoruz; öğretmen/kaynak
-- üreticisi ileride bunu gerçek bir topics.id'ye eşleyebilir.

alter table questions add column topic_label text;
alter table chat_messages add column topic_label text;
