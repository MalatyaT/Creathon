-- Chatbot'un (Soru Sor) kaynak referansı şu ana kadar "son 15 taramanın özeti" gibi kaba bir
-- sezgiseldi (bkz. find-related-sources.ts, TODO.md "İleride" notu). Artık pgvector embedding
-- + match_questions altyapısı (migration 0012) var — öğrencinin sorusunu embed edip havuzdaki
-- gerçekten en benzer soruyu bulabiliyoruz. match_questions'ı olduğu gibi bırakıp (Soru
-- Oluştur RAG pilotu ona bağlı, dokunmuyoruz) kazanım/kaynak sayfası için ek sütunlar döndüren
-- ayrı bir fonksiyon ekliyoruz. SECURITY DEFINER değil — çağıranın RLS'i (questions_readable_
-- when_approved) aynen geçerli, sadece approved sorular dönebilir.

create or replace function match_questions_with_source(
  query_embedding vector(768),
  match_count int default 5
)
returns table (
  id uuid,
  question_text text,
  topic_id uuid,
  topic_label text,
  source_scan_id uuid,
  subject_name text,
  similarity float
)
language sql stable
as $$
  select
    q.id,
    q.question_text,
    q.topic_id,
    q.topic_label,
    q.source_scan_id,
    q.subject_name,
    1 - (q.embedding <=> query_embedding) as similarity
  from questions q
  where q.embedding is not null
  order by q.embedding <=> query_embedding
  limit match_count
$$;
