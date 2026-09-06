-- RAG unification (Matematik pilot): pgvector cosine-benzerlik araması PostgREST üzerinden
-- doğrudan filtrelenemediği (`<=>` operatörü) için bir RPC fonksiyonu gerekiyor. Bir kazanım
-- embed edilip bu fonksiyona verilince, aynı derste en yakın N soruyu (referans/few-shot
-- örnek olarak kullanılacak) döndürür. Sadece embedding'i dolu satırlarla sınırlı, aksi halde
-- null embedding'ler mesafe hesaplamasında hata verir.

create or replace function match_questions(
  query_embedding vector(768),
  match_count int default 5,
  filter_subject text default null
)
returns table (
  id uuid,
  question_text text,
  options jsonb,
  correct_answer text,
  topic_label text,
  difficulty smallint,
  similarity float
)
language sql stable
as $$
  select
    q.id,
    q.question_text,
    q.options,
    q.correct_answer,
    q.topic_label,
    q.difficulty,
    1 - (q.embedding <=> query_embedding) as similarity
  from questions q
  where q.embedding is not null
    and (filter_subject is null or q.subject_name = filter_subject)
  order by q.embedding <=> query_embedding
  limit match_count
$$;
