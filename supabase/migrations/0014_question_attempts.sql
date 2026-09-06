-- Kağıt Puanlama (Track 2) + Dijital İkiz'in (Track 3) beklediği ilk gerçek doğru/yanlış
-- veri kaynağı. `homework` zaten gerçek question_ids + `questions.correct_answer` taşıyor
-- (bkz. 0001_init) — yeni bir "sınav + cevap anahtarı" modeli icat etmek yerine kağıt
-- puanlamayı doğrudan var olan homework'e bağlıyoruz.
create table question_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  homework_id uuid references homework(id) on delete set null,
  question_id uuid not null references questions(id) on delete cascade,
  chosen_answer text,
  -- Çoktan seçmeli: Gemini okuyup deterministik karşılaştırır, direkt dolar. Açık uçlu:
  -- AI sadece öğrencinin yazdığını okur (doğruluk yargısı vermez), null kalır — öğretmen
  -- confirmOpenEndedAttempt ile elle işaretleyene kadar needs_review=true kalır.
  is_correct boolean,
  needs_review boolean not null default false,
  graded_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table question_attempts enable row level security;

create policy "attempts_self_or_linked" on question_attempts for select using (
  student_id = auth.uid()
  or exists (
    select 1 from student_links l
    where l.student_id = question_attempts.student_id and l.linked_profile_id = auth.uid()
  )
);

create policy "attempts_writable_by_grader" on question_attempts for insert with check (graded_by = auth.uid());
create policy "attempts_updatable_by_grader" on question_attempts for update using (graded_by = auth.uid());
