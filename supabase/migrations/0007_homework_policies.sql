-- homework'te SELECT ve (kendi kendine atama için) INSERT policy'leri vardı ama
-- öğrencinin kendi ödevini tamamlandı işaretlemesi (completed_at) için UPDATE policy'si
-- hiç eklenmemişti.
create policy "homework_completable_by_student" on homework for update using (student_id = auth.uid());
