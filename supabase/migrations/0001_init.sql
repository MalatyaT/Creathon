-- İkiz platformu — ilk şema
-- Roller: student, teacher, parent, content_creator (kaynak üreticisi — kitap tarayıp
-- soru havuzunu besleyen rol; öğretmenden ayrı çünkü sınıf/ödev yönetmiyor, sadece havuza katkı sağlıyor).
-- Her rolün kendi giriş/kayıt akışı var (bkz. web/src/app/(auth)). auth.users tablosunu Supabase Auth
-- yönetir; profiles tablosu her auth kullanıcısına 1-1 eşlenir.

-- pgvector eklentisi (soru benzerlik/tekrar kontrolü için) — questions.embedding'den önce gerekli
create extension if not exists vector;

create type user_role as enum ('student', 'teacher', 'parent', 'content_creator');
create type exam_program as enum ('yks', 'lgs');
create type question_source as enum ('scan', 'ai_generated', 'manual');
create type review_status as enum ('pending_review', 'approved', 'rejected');
create type scan_status as enum ('uploaded', 'processing', 'done', 'error');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null,
  full_name text not null,
  created_at timestamptz not null default now()
);

create table students (
  id uuid primary key references profiles(id) on delete cascade,
  program exam_program not null default 'yks',
  grade text,
  il text,
  ilce text,
  created_at timestamptz not null default now()
);

-- Öğretmen/veli ile öğrenci arasındaki bağlantı (çoklu öğrenci takibi)
create table student_links (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  linked_profile_id uuid not null references profiles(id) on delete cascade,
  relation user_role not null, -- 'teacher' veya 'parent'
  created_at timestamptz not null default now(),
  unique (student_id, linked_profile_id)
);

create table subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  program exam_program not null
);

create table topics (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects(id) on delete cascade,
  name text not null,
  code text,
  created_at timestamptz not null default now()
);

create table scans (
  id uuid primary key default gen_random_uuid(),
  uploaded_by uuid not null references profiles(id) on delete cascade,
  storage_path text not null,
  status scan_status not null default 'uploaded',
  raw_extraction jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create table questions (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references topics(id) on delete set null,
  question_text text not null,
  options jsonb,
  correct_answer text,
  explanation text,
  difficulty smallint check (difficulty between 1 and 5),
  source question_source not null default 'manual',
  source_scan_id uuid references scans(id) on delete set null,
  status review_status not null default 'pending_review',
  created_by uuid references profiles(id) on delete set null,
  embedding vector(768),
  created_at timestamptz not null default now()
);

create table twin_state (
  student_id uuid not null references students(id) on delete cascade,
  topic_id uuid not null references topics(id) on delete cascade,
  risk_score numeric not null default 0 check (risk_score between 0 and 100),
  sample_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (student_id, topic_id)
);

create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text,
  image_path text,
  topic_id uuid references topics(id) on delete set null,
  created_at timestamptz not null default now()
);

create table homework (
  id uuid primary key default gen_random_uuid(),
  assigned_by uuid references profiles(id) on delete set null,
  student_id uuid not null references students(id) on delete cascade,
  title text not null,
  question_ids uuid[] not null default '{}',
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table exams (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  program exam_program not null,
  taken_at date not null,
  subject_scores jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- RLS
alter table profiles enable row level security;
alter table students enable row level security;
alter table student_links enable row level security;
alter table scans enable row level security;
alter table questions enable row level security;
alter table twin_state enable row level security;
alter table chat_messages enable row level security;
alter table homework enable row level security;
alter table exams enable row level security;

create policy "profiles_self" on profiles for select using (id = auth.uid());
create policy "profiles_self_insert" on profiles for insert with check (id = auth.uid());
create policy "profiles_self_update" on profiles for update using (id = auth.uid());

-- Öğrenci kayıt akışında students satırını da kullanıcının kendisi oluşturur
create policy "students_self_insert" on students for insert with check (id = auth.uid());
create policy "students_self_update" on students for update using (id = auth.uid());

create policy "students_self_or_linked" on students for select using (
  id = auth.uid()
  or exists (select 1 from student_links l where l.student_id = students.id and l.linked_profile_id = auth.uid())
);

create policy "student_links_visible_to_participants" on student_links for select using (
  linked_profile_id = auth.uid() or student_id = auth.uid()
);

create policy "scans_owned" on scans for all using (uploaded_by = auth.uid());

create policy "questions_readable_when_approved" on questions for select using (
  status = 'approved' or created_by = auth.uid()
);
create policy "questions_writable_by_creator" on questions for insert with check (created_by = auth.uid());
create policy "questions_updatable_by_creator" on questions for update using (created_by = auth.uid());

create policy "twin_state_self_or_linked" on twin_state for select using (
  student_id = auth.uid()
  or exists (select 1 from student_links l where l.student_id = twin_state.student_id and l.linked_profile_id = auth.uid())
);

create policy "chat_messages_owner_only" on chat_messages for all using (student_id = auth.uid());

create policy "homework_self_or_linked" on homework for select using (
  student_id = auth.uid()
  or assigned_by = auth.uid()
  or exists (select 1 from student_links l where l.student_id = homework.student_id and l.linked_profile_id = auth.uid())
);
create policy "homework_writable_by_assigner" on homework for insert with check (assigned_by = auth.uid());

create policy "exams_self_or_linked" on exams for select using (
  student_id = auth.uid()
  or exists (select 1 from student_links l where l.student_id = exams.student_id and l.linked_profile_id = auth.uid())
);
create policy "exams_writable_by_self" on exams for insert with check (student_id = auth.uid());
