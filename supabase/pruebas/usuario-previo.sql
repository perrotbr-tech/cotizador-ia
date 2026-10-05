-- Crea un usuario antes de aplicar la migracion por primera vez.
-- Imita la cuenta que Eduardo ya tiene en Supabase cuando llega 0001_base.sql.
-- Se corre entre el andamio y la migracion: en ese momento no existe
-- public.perfiles ni la empresa, asi que este usuario solo puede quedar
-- enlazado por el bloque de enlace de la migracion.

\set ON_ERROR_STOP on

insert into auth.users (email, raw_user_meta_data)
values ('anterior.migracion@ejemplo.cl', '{}'::jsonb)
on conflict (email) do nothing;

do $$
begin
  assert exists (
    select 1 from auth.users where email = 'anterior.migracion@ejemplo.cl'
  ), 'No quedo creado el usuario anterior a la migracion.';

  assert not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'perfiles'
  ), 'La migracion ya estaba aplicada: este usuario no es anterior a ella.';
end
$$;
