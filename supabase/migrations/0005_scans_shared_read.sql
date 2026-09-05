-- `scans_owned` politikası SELECT dahil her işlemi yükleyenle sınırlıyordu; bu yüzden
-- chatbot'un kaynak önerisi (find-related-sources.ts) başka bir kullanıcının (kaynak
-- üreticisinin) taradığı sayfaları hiç göremiyordu — RLS onları sessizce filtreliyordu.
-- İşlenmiş (status='done') taramalar artık herkese okunabilir; yazma/silme hâlâ sadece
-- yükleyene ait (questions tablosundaki approved/created_by deseniyle aynı mantık).

drop policy if exists "scans_owned" on scans;

create policy "scans_readable_when_done" on scans for select using (
  status = 'done' or uploaded_by = auth.uid()
);
create policy "scans_writable_by_uploader" on scans for insert with check (uploaded_by = auth.uid());
create policy "scans_updatable_by_uploader" on scans for update using (uploaded_by = auth.uid());
create policy "scans_deletable_by_uploader" on scans for delete using (uploaded_by = auth.uid());
