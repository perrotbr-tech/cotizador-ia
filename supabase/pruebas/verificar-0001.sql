-- Verifica lo que dejo la migracion 0001_base.sql.
-- Cada assert que falla corta el script con error.

\set ON_ERROR_STOP on

-- 1. Las 10 tablas del spec existen, con RLS activada y una politica cada una.
do $$
declare
  v_esperadas text[] := array[
    'empresas', 'perfiles', 'tiendas', 'productos', 'precios_observados',
    'cotizaciones', 'lineas', 'candidatos', 'uso_diario', 'contadores'
  ];
  v_tabla text;
  v_rls boolean;
  v_politicas integer;
begin
  foreach v_tabla in array v_esperadas
  loop
    select c.relrowsecurity into v_rls
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = v_tabla;

    assert v_rls is not null, format('Falta la tabla %s.', v_tabla);
    assert v_rls, format('La tabla %s no tiene RLS activada.', v_tabla);

    select count(*) into v_politicas
    from pg_policies where schemaname = 'public' and tablename = v_tabla;
    assert v_politicas = 1, format('La tabla %s no tiene exactamente una politica.', v_tabla);
  end loop;
end
$$;

-- 2. Ninguna politica alcanza al rol anonimo.
do $$
declare
  v_con_anon integer;
begin
  select count(*) into v_con_anon
  from pg_policies where schemaname = 'public' and roles::text like '%anon%';
  assert v_con_anon = 0, 'Hay politicas que alcanzan al rol anonimo.';
end
$$;

-- 3. Todas las tablas llevan empresa_id, salvo empresas, donde su id lo es.
do $$
declare
  v_sin_empresa_id text;
begin
  select string_agg(t.table_name, ', ') into v_sin_empresa_id
  from information_schema.tables t
  where t.table_schema = 'public'
    and t.table_type = 'BASE TABLE'
    and t.table_name <> 'empresas'
    and not exists (
      select 1 from information_schema.columns c
      where c.table_schema = 'public' and c.table_name = t.table_name
        and c.column_name = 'empresa_id'
    );
  assert v_sin_empresa_id is null, format('Tablas sin empresa_id: %s.', v_sin_empresa_id);
end
$$;

-- 4. Todo el dinero del esquema es entero.
do $$
declare
  v_no_enteras text;
begin
  select string_agg(format('%s.%s (%s)', table_name, column_name, data_type), ', ')
    into v_no_enteras
  from information_schema.columns
  where table_schema = 'public'
    and (
      column_name in ('precio_publicado', 'costo_neto', 'costo_neto_unitario',
                      'precio_venta_neto_unitario', 'total_neto', 'iva', 'total')
    )
    and data_type <> 'integer';
  assert v_no_enteras is null, format('Columnas de dinero que no son integer: %s.', v_no_enteras);
end
$$;

-- 5. Datos iniciales: una empresa, su contador y las tiendas del spec.
do $$
declare
  v_empresas integer;
  v_preferidas integer;
  v_excluidas integer;
  v_sin_iva integer;
  v_correlativo integer;
begin
  select count(*) into v_empresas from public.empresas;
  assert v_empresas = 1, format('Se esperaba una empresa y hay %s.', v_empresas);

  select ultimo_correlativo into v_correlativo from public.contadores;
  assert v_correlativo = 0, 'El contador de correlativo no parte en cero.';

  select count(*) into v_preferidas from public.tiendas where estado = 'preferida';
  assert v_preferidas = 12, format('Se esperaban 12 tiendas preferidas y hay %s.', v_preferidas);

  select count(*) into v_excluidas from public.tiendas where estado = 'excluida';
  assert v_excluidas = 5, format('Se esperaban 5 tiendas excluidas y hay %s.', v_excluidas);

  select count(*) into v_sin_iva from public.tiendas where not publica_con_iva;
  assert v_sin_iva = 0, 'Al instalar, todas las tiendas quedan con IVA incluido.';
end
$$;

-- 6. El margen fuera del rango de 0 % a 90 % se rechaza.
do $$
begin
  begin
    insert into public.empresas (nombre, margen_general) values ('Prueba', 91);
    raise exception 'La base acepto un margen de 91 %%.';
  exception
    when check_violation then null;
  end;

  begin
    insert into public.empresas (nombre, margen_general) values ('Prueba', -1);
    raise exception 'La base acepto un margen de -1 %%.';
  exception
    when check_violation then null;
  end;
end
$$;

-- 7. Una cotizacion aprobada lleva codigo; un borrador no.
do $$
declare
  v_empresa_id uuid;
begin
  select id into v_empresa_id from public.empresas limit 1;

  begin
    insert into public.cotizaciones (empresa_id, cliente_final, margen_general, codigo)
    values (v_empresa_id, 'Prueba', 20, 'COT-999999');
    raise exception 'La base acepto un borrador con codigo.';
  exception
    when check_violation then null;
  end;

  begin
    insert into public.cotizaciones (empresa_id, cliente_final, margen_general, estado)
    values (v_empresa_id, 'Prueba', 20, 'aprobada');
    raise exception 'La base acepto una cotizacion aprobada sin codigo.';
  exception
    when check_violation then null;
  end;
end
$$;

-- 8. Una linea acepta cantidad con decimales, y como maximo un candidato elegido.
do $$
declare
  v_empresa_id uuid;
  v_cotizacion_id uuid;
  v_linea_id uuid;
  v_cantidad numeric;
begin
  select id into v_empresa_id from public.empresas limit 1;

  insert into public.cotizaciones (empresa_id, cliente_final, margen_general)
  values (v_empresa_id, 'Prueba de cantidad decimal', 20)
  returning id into v_cotizacion_id;

  insert into public.lineas (empresa_id, cotizacion_id, orden, descripcion, cantidad)
  values (v_empresa_id, v_cotizacion_id, 1, 'Resma carta 75 g', 0.5)
  returning id, cantidad into v_linea_id, v_cantidad;

  assert v_cantidad = 0.5, format('La cantidad quedo en %s en vez de 0,5.', v_cantidad);

  insert into public.candidatos (empresa_id, linea_id, titulo, precio_publicado, costo_neto, elegido)
  values (v_empresa_id, v_linea_id, 'Primero', 1190, 1000, true);

  begin
    insert into public.candidatos (empresa_id, linea_id, titulo, precio_publicado, costo_neto, elegido)
    values (v_empresa_id, v_linea_id, 'Segundo', 1500, 1261, true);
    raise exception 'La base acepto dos candidatos elegidos en la misma linea.';
  exception
    when unique_violation then null;
  end;

  delete from public.cotizaciones where id = v_cotizacion_id;
end
$$;

-- 9. El trigger enlaza al usuario nuevo con la empresa.
do $$
declare
  v_usuario_id uuid;
  v_empresa_id uuid;
  v_nombre text;
begin
  insert into auth.users (email, raw_user_meta_data)
  values ('prueba.migracion@ejemplo.cl', '{"nombre":"Prueba"}'::jsonb)
  returning id into v_usuario_id;

  select empresa_id, nombre into v_empresa_id, v_nombre
  from public.perfiles where id = v_usuario_id;

  assert v_empresa_id is not null, 'El usuario nuevo quedo sin perfil ni empresa.';
  assert v_nombre = 'Prueba', format('El nombre del perfil quedo en %s.', v_nombre);

  delete from auth.users where id = v_usuario_id;
end
$$;

\echo 'Verificacion de 0001_base.sql: todo en orden.'
