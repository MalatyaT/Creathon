-- Sohbet yanıtlarının taranan kitaplara/sorulara referans verebilmesi için:
-- her tarama artık kitap adı + sayfa no + Gemini'nin çıkardığı kısa konu anlatımı
-- özetiyle saklanıyor. Chat yanıtları da (varsa) hangi kaynağa referans verdiğini
-- serbest metin olarak tutuyor. Gerçek benzerlik araması yerine (henüz seed edilmiş
-- embedding/index yok) sohbet, en güncel taramaların özet+örnek sorularını
-- bağlam olarak alıp kendi ilgi değerlendirmesini yapıyor — bkz.
-- lib/gemini-tasks/find-related-sources.ts.

alter table scans add column book_title text;
alter table scans add column page_number integer;
alter table scans add column summary text;

alter table chat_messages add column source_reference text;
