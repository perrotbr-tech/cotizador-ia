-- =====================================================================
-- Cotizador IA — migracion base (paso 1)
--
-- Crea las 10 tablas de la seccion "Datos" de specs/SPEC-MVP.md, activa
-- la seguridad a nivel de fila, carga los datos iniciales y deja el
-- enlace automatico de cada usuario nuevo con la empresa.
--
-- Se aplica pegando este archivo completo en el editor SQL de Supabase.
-- Es idempotente: se puede volver a aplicar sin duplicar datos.
--
-- Convenciones que respeta:
--   - Todo el dinero es entero en pesos chilenos.
--   - El margen es un entero de 0 a 90, sobre el precio de venta.
--   - Todas las tablas llevan empresa_id.
--   - La zona horaria del sistema es America/Santiago.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'estado_tienda') then
    create type public.estado_tienda as enum ('preferida', 'sin_clasificar', 'excluida');
  end if;

  if not exists (select 1 from pg_type where typname = 'estado_cotizacion') then
    create type public.estado_cotizacion as enum ('borrador', 'aprobada');
  end if;

  if not exists (select 1 from pg_type where typname = 'estado_busqueda') then
    create type public.estado_busqueda as enum
      ('pendiente', 'buscando', 'lista', 'sin_resultados', 'error');
  end if;

  if not exists (select 1 from pg_type where typname = 'origen_costo') then
    create type public.origen_costo as enum
      ('sin_costo', 'candidato', 'manual', 'producto_guardado');
  end if;
end
$$;

-- ---------------------------------------------------------------------
-- empresas
-- ---------------------------------------------------------------------

create table if not exists public.empresas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  rut text,
  direccion text,
  correo text,
  telefono text,
  condiciones_comerciales text,
  margen_general smallint not null default 20
    constraint empresas_margen_general_rango check (margen_general between 0 and 90),
  vigencia_dias smallint not null default 15
    constraint empresas_vigencia_dias_rango check (vigencia_dias between 1 and 365),
  creada_en timestamptz not null default now()
);

comment on column public.empresas.margen_general is
  'Porcentaje entero sobre el precio de venta, de 0 a 90.';
comment on column public.empresas.vigencia_dias is
  'Dias que vale una cotizacion aprobada desde su aprobacion.';

-- ---------------------------------------------------------------------
-- perfiles
-- ---------------------------------------------------------------------

create table if not exists public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nombre text,
  creado_en timestamptz not null default now()
);

create index if not exists perfiles_empresa_idx on public.perfiles (empresa_id);

comment on table public.perfiles is
  'Enlace entre un usuario de auth.users y su empresa. El id es el id del usuario.';

-- ---------------------------------------------------------------------
-- tiendas
-- ---------------------------------------------------------------------

create table if not exists public.tiendas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nombre text not null,
  alias text not null,
  estado public.estado_tienda not null default 'sin_clasificar',
  publica_con_iva boolean not null default true,
  creada_en timestamptz not null default now(),
  constraint tiendas_alias_unico unique (empresa_id, alias)
);

create index if not exists tiendas_empresa_idx on public.tiendas (empresa_id);

comment on column public.tiendas.alias is
  'Nombre normalizado con que la tienda aparece en el resultado de la busqueda.';
comment on column public.tiendas.publica_con_iva is
  'Verdadero: el precio publicado incluye IVA y se divide por 1,19 para el costo neto.';

-- ---------------------------------------------------------------------
-- productos
-- ---------------------------------------------------------------------

create table if not exists public.productos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nombre text not null,
  marca text,
  unidad text,
  texto_busqueda_normalizado text not null,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint productos_texto_busqueda_unico unique (empresa_id, texto_busqueda_normalizado)
);

create index if not exists productos_empresa_idx on public.productos (empresa_id);

-- ---------------------------------------------------------------------
-- precios_observados
-- ---------------------------------------------------------------------

create table if not exists public.precios_observados (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  producto_id uuid not null references public.productos (id) on delete cascade,
  tienda_id uuid references public.tiendas (id) on delete set null,
  titulo_original text not null,
  precio_publicado integer not null
    constraint precios_observados_publicado_no_negativo check (precio_publicado >= 0),
  costo_neto integer not null
    constraint precios_observados_neto_no_negativo check (costo_neto >= 0),
  incluye_iva boolean not null,
  url text,
  capturado_en timestamptz not null default now()
);

create index if not exists precios_observados_empresa_idx
  on public.precios_observados (empresa_id);
create index if not exists precios_observados_producto_idx
  on public.precios_observados (producto_id, capturado_en desc);

comment on table public.precios_observados is
  'Evidencia de cada precio: tienda, titulo original, enlace, fecha y hora de captura, '
  'precio tal como vino y si incluye IVA.';

-- ---------------------------------------------------------------------
-- cotizaciones
-- ---------------------------------------------------------------------

create table if not exists public.cotizaciones (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  codigo text,
  estado public.estado_cotizacion not null default 'borrador',
  cliente_final text not null,
  texto_original text,
  nombre_archivo text,
  margen_general smallint not null
    constraint cotizaciones_margen_general_rango check (margen_general between 0 and 90),
  total_neto integer not null default 0
    constraint cotizaciones_total_neto_no_negativo check (total_neto >= 0),
  iva integer not null default 0
    constraint cotizaciones_iva_no_negativo check (iva >= 0),
  total integer not null default 0
    constraint cotizaciones_total_no_negativo check (total >= 0),
  vigencia_hasta date,
  creada_por uuid references auth.users (id) on delete set null,
  aprobada_por uuid references auth.users (id) on delete set null,
  aprobada_en timestamptz,
  creada_en timestamptz not null default now(),
  constraint cotizaciones_codigo_unico unique (empresa_id, codigo),
  -- Una cotizacion aprobada lleva codigo, quien la aprobo y cuando.
  -- Un borrador no lleva ninguno de los tres.
  constraint cotizaciones_aprobada_completa check (
    (estado = 'aprobada' and codigo is not null and aprobada_en is not null)
    or (estado = 'borrador' and codigo is null and aprobada_en is null)
  )
);

create index if not exists cotizaciones_empresa_idx
  on public.cotizaciones (empresa_id, creada_en desc);

-- ---------------------------------------------------------------------
-- lineas
-- ---------------------------------------------------------------------

create table if not exists public.lineas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  cotizacion_id uuid not null references public.cotizaciones (id) on delete cascade,
  orden integer not null constraint lineas_orden_positivo check (orden > 0),
  texto_original text,
  descripcion text not null,
  cantidad numeric(12, 3) not null default 1
    constraint lineas_cantidad_positiva check (cantidad > 0),
  unidad text,
  marca text,
  texto_busqueda text,
  estado_busqueda public.estado_busqueda not null default 'pendiente',
  origen_costo public.origen_costo not null default 'sin_costo',
  costo_neto_unitario integer
    constraint lineas_costo_no_negativo check (costo_neto_unitario >= 0),
  margen smallint constraint lineas_margen_rango check (margen between 0 and 90),
  precio_venta_neto_unitario integer
    constraint lineas_precio_venta_no_negativo check (precio_venta_neto_unitario >= 0),
  total_neto integer constraint lineas_total_no_negativo check (total_neto >= 0),
  marcas text[] not null default '{}',
  creada_en timestamptz not null default now(),
  constraint lineas_orden_unico unique (cotizacion_id, orden)
);

create index if not exists lineas_cotizacion_idx on public.lineas (cotizacion_id, orden);
create index if not exists lineas_empresa_idx on public.lineas (empresa_id);

comment on column public.lineas.cantidad is
  'Puede tener decimales: la contraprueba del spec exige una cantidad de 0,5.';
comment on column public.lineas.marcas is
  'Marcas de atencion de la linea: sin_costo, precio_web, tienda_sin_clasificar, '
  'revisar_cantidad, revisar_unidad, precio_guardado.';

-- ---------------------------------------------------------------------
-- candidatos
-- ---------------------------------------------------------------------

create table if not exists public.candidatos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  linea_id uuid not null references public.lineas (id) on delete cascade,
  tienda_id uuid references public.tiendas (id) on delete set null,
  titulo text not null,
  precio_publicado integer not null
    constraint candidatos_publicado_no_negativo check (precio_publicado >= 0),
  costo_neto integer not null
    constraint candidatos_neto_no_negativo check (costo_neto >= 0),
  url text,
  miniatura text,
  posicion integer,
  elegido boolean not null default false,
  capturado_en timestamptz not null default now()
);

create index if not exists candidatos_linea_idx on public.candidatos (linea_id, posicion);
create index if not exists candidatos_empresa_idx on public.candidatos (empresa_id);

-- Como maximo un candidato elegido por linea.
create unique index if not exists candidatos_un_elegido_por_linea
  on public.candidatos (linea_id)
  where elegido;

-- ---------------------------------------------------------------------
-- uso_diario
-- ---------------------------------------------------------------------

create table if not exists public.uso_diario (
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  fecha date not null,
  busquedas integer not null default 0
    constraint uso_diario_busquedas_no_negativas check (busquedas >= 0),
  llamadas_ia integer not null default 0
    constraint uso_diario_llamadas_no_negativas check (llamadas_ia >= 0),
  primary key (empresa_id, fecha)
);

comment on table public.uso_diario is
  'Consumo por dia, contra los topes TOPE_BUSQUEDAS_DIA y TOPE_BUSQUEDAS_MES.';

-- ---------------------------------------------------------------------
-- contadores
-- ---------------------------------------------------------------------

create table if not exists public.contadores (
  empresa_id uuid primary key references public.empresas (id) on delete cascade,
  ultimo_correlativo integer not null default 0
    constraint contadores_correlativo_no_negativo check (ultimo_correlativo >= 0)
);

comment on table public.contadores is
  'Ultimo correlativo entregado. El paso 4 lo asigna con una funcion que bloquea la fila.';

-- =====================================================================
-- Seguridad a nivel de fila
--
-- El MVP opera con una sola empresa: la regla del spec es que solo los
-- usuarios con sesion iniciada leen y escriben. Ninguna politica alcanza
-- al rol anonimo, asi que sin sesion no se lee ni se escribe nada.
-- =====================================================================

do $$
declare
  v_tabla text;
begin
  foreach v_tabla in array array[
    'empresas', 'perfiles', 'tiendas', 'productos', 'precios_observados',
    'cotizaciones', 'lineas', 'candidatos', 'uso_diario', 'contadores'
  ]
  loop
    execute format('alter table public.%I enable row level security', v_tabla);
    execute format('drop policy if exists %I on public.%I',
                   'con_sesion_' || v_tabla, v_tabla);
    execute format(
      'create policy %I on public.%I for all to authenticated using (true) with check (true)',
      'con_sesion_' || v_tabla, v_tabla);
  end loop;
end
$$;

-- =====================================================================
-- Enlace automatico de cada usuario nuevo con la empresa
-- =====================================================================

create or replace function public.enlazar_usuario_nuevo()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_empresa_id uuid;
begin
  select id into v_empresa_id from public.empresas order by creada_en, id limit 1;

  if v_empresa_id is null then
    return new;
  end if;

  insert into public.perfiles (id, empresa_id, nombre)
  values (
    new.id,
    v_empresa_id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'nombre'), ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

comment on function public.enlazar_usuario_nuevo() is
  'Crea el perfil de cada usuario nuevo y lo enlaza con la primera empresa. '
  'El MVP opera con una sola empresa.';

drop trigger if exists al_crear_usuario on auth.users;

create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.enlazar_usuario_nuevo();

-- Enlaza tambien los usuarios que ya existian antes de aplicar esta migracion.
insert into public.perfiles (id, empresa_id, nombre)
select
  u.id,
  (select id from public.empresas order by creada_en, id limit 1),
  split_part(u.email, '@', 1)
from auth.users u
where (select count(*) from public.empresas) > 0
on conflict (id) do nothing;

-- =====================================================================
-- Datos iniciales
-- =====================================================================

-- La empresa. El MVP opera con una sola, con un id fijo para que esta
-- migracion se pueda volver a aplicar sin crear una segunda.
insert into public.empresas (id, nombre, margen_general, vigencia_dias)
values ('00000000-0000-0000-0000-000000000001', 'Mi empresa', 20, 15)
on conflict (id) do nothing;

-- Su contador de correlativo.
insert into public.contadores (empresa_id, ultimo_correlativo)
values ('00000000-0000-0000-0000-000000000001', 0)
on conflict (empresa_id) do nothing;

-- Las tiendas que lista el spec. Todas entran con IVA incluido.
insert into public.tiendas (empresa_id, nombre, alias, estado, publica_con_iva)
values
  -- Preferidas: sus resultados van primero.
  ('00000000-0000-0000-0000-000000000001', 'Lápiz López', 'lapiz lopez',   'preferida', true),
  ('00000000-0000-0000-0000-000000000001', 'Nacional',    'nacional',      'preferida', true),
  ('00000000-0000-0000-0000-000000000001', 'PC Factory',  'pc factory',    'preferida', true),
  ('00000000-0000-0000-0000-000000000001', 'SP Digital',  'sp digital',    'preferida', true),
  ('00000000-0000-0000-0000-000000000001', 'Wei',         'wei',           'preferida', true),
  ('00000000-0000-0000-0000-000000000001', 'Winpy',       'winpy',         'preferida', true),
  ('00000000-0000-0000-0000-000000000001', 'MyShop',      'myshop',        'preferida', true),
  ('00000000-0000-0000-0000-000000000001', 'Jumbo',       'jumbo',         'preferida', true),
  ('00000000-0000-0000-0000-000000000001', 'Alvi',        'alvi',          'preferida', true),
  ('00000000-0000-0000-0000-000000000001', 'Sodimac',     'sodimac',       'preferida', true),
  ('00000000-0000-0000-0000-000000000001', 'Falabella',   'falabella',     'preferida', true),
  ('00000000-0000-0000-0000-000000000001', 'Paris',       'paris',         'preferida', true),
  -- Excluidas: sus resultados no se muestran nunca.
  ('00000000-0000-0000-0000-000000000001', 'Mercado Libre', 'mercado libre', 'excluida', true),
  ('00000000-0000-0000-0000-000000000001', 'AliExpress',    'aliexpress',    'excluida', true),
  ('00000000-0000-0000-0000-000000000001', 'Temu',          'temu',          'excluida', true),
  ('00000000-0000-0000-0000-000000000001', 'Shein',         'shein',         'excluida', true),
  ('00000000-0000-0000-0000-000000000001', 'Amazon',        'amazon',        'excluida', true)
on conflict (empresa_id, alias) do nothing;
