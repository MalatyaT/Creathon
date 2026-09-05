-- profiles'ta sadece "kendi satırını gör" policy'si vardı — öğretmen paneli linked
-- bir öğrencinin adını (role/full_name) hiç okuyamıyordu (RLS sessizce boş döndürüyordu).
-- twin_state/homework'teki "self_or_linked" deseniyle aynı mantık.
create policy "profiles_readable_by_linked" on profiles for select using (
  id = auth.uid()
  or exists (select 1 from student_links l where l.student_id = profiles.id and l.linked_profile_id = auth.uid())
);
