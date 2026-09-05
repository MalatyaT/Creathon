-- student_links'te sadece SELECT policy'si vardı — öğretmenin (ya da velinin) bir
-- öğrenciyi "sınıfına" eklemesini sağlayan bir INSERT policy hiç yoktu. Öğrenci onayı
-- gerektiren bir davet akışı yerine (kapsam dışı, bkz. TODO.md), demo hızı için
-- öğretmen/veli e-posta ile öğrenciyi doğrudan kendi listesine ekleyebiliyor.
create policy "student_links_insertable_by_linker" on student_links for insert with check (
  linked_profile_id = auth.uid()
);
