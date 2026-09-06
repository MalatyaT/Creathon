-- Chatbot'a "yeni oturum" (thread) ve önceki oturumları listeleme/kaydetme özelliği
-- eklemek için: chat_messages artık tek bir düz akış değil, chat_sessions altında
-- gruplanıyor. Sidebar'daki oturum başlığı ilk mesajdan (konu etiketi ya da soru
-- metninden) otomatik türetiliyor (bkz. panel/ogrenci/actions.ts).

create table chat_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table chat_sessions enable row level security;

create policy "chat_sessions_owner_only" on chat_sessions for all using (student_id = auth.uid());

alter table chat_messages add column session_id uuid references chat_sessions(id) on delete cascade;

create index chat_messages_session_id_idx on chat_messages (session_id);
