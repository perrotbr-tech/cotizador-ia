-- Verifica el caso del usuario que ya existia antes de la primera aplicacion:
-- la migracion lo tiene que dejar enlazado con la empresa.
-- Depende de supabase/pruebas/usuario-previo.sql, que lo crea antes de aplicarla.

\set ON_ERROR_STOP on

do $$
declare
  v_usuario_id uuid;
  v_empresa_id uuid;
  v_nombre text;
  v_empresa_semilla uuid;
begin
  select id into v_usuario_id
  from auth.users where email = 'anterior.migracion@ejemplo.cl';

  assert v_usuario_id is not null,
    'Falta el usuario anterior a la migracion: corre primero usuario-previo.sql.';

  select empresa_id, nombre into v_empresa_id, v_nombre
  from public.perfiles where id = v_usuario_id;

  assert v_empresa_id is not null,
    'El usuario que ya existia antes de la migracion quedo sin perfil ni empresa.';

  select id into v_empresa_semilla from public.empresas order by creada_en, id limit 1;
  assert v_empresa_id = v_empresa_semilla,
    format('El perfil quedo en la empresa %s en vez de %s.', v_empresa_id, v_empresa_semilla);

  assert v_nombre = 'anterior.migracion',
    format('El nombre del perfil quedo en %s.', v_nombre);
end
$$;

\echo 'Usuario anterior a la migracion: enlazado con la empresa.'
