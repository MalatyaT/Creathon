-- Kayıt formunda `supabase.auth.signUp({ options: { data: {...} } })` ile gönderilen
-- role/full_name/program/grade/il/ilce alanları auth.users.raw_user_meta_data'ya düşer.
-- Bu trigger, e-posta onayı açık/kapalı fark etmeksizin (oturum henüz yokken bile)
-- profiles + students satırlarını otomatik oluşturur — client tarafında ayrıca insert
-- yapmaya/RLS zamanlamasına güvenmeye gerek bırakmaz.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  new_role user_role := coalesce(nullif(meta->>'role', '')::user_role, 'student');
begin
  insert into public.profiles (id, role, full_name)
  values (new.id, new_role, coalesce(meta->>'full_name', ''));

  if new_role = 'student' then
    insert into public.students (id, program, grade, il, ilce)
    values (
      new.id,
      coalesce(nullif(meta->>'program', '')::exam_program, 'yks'),
      nullif(meta->>'grade', ''),
      nullif(meta->>'il', ''),
      nullif(meta->>'ilce', '')
    );
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
