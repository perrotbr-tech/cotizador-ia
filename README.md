# Cotizador IA

Aplicación web para cotizar insumos y materiales a partir de la solicitud de un cliente final.
El cotizador pega o sube la solicitud, el sistema la separa en líneas, busca el precio de cada
producto en Google Shopping de Chile, el cotizador elige entre los candidatos, se aplica el
margen y sale una cotización en PDF y Excel.

- **Alcance vigente:** [`specs/SPEC-MVP.md`](specs/SPEC-MVP.md)
- **Orden de construcción:** [`GUIA-DE-HOY.md`](GUIA-DE-HOY.md)
- **Reglas para agentes:** [`AGENTS.md`](AGENTS.md)
- **Destino a futuro:** [`specs/SPEC-MAESTRO.md`](specs/SPEC-MAESTRO.md) — es referencia, no se construye

Este repositorio va por el paso 1 de la guía: la base. Todavía no se puede crear una cotización.

## Puesta en marcha

Los tres pasos van en este orden: primero la base de datos, después el usuario, al final las
variables.

### 1. Aplicar la migración en Supabase

1. Crea un proyecto de Supabase en la región **São Paulo**.
2. Abre **SQL Editor** → **New query**.
3. Pega el contenido completo de [`supabase/migrations/0001_base.sql`](supabase/migrations/0001_base.sql)
   y ejecútalo.
4. Deberías ver avisos (`NOTICE`) y ningún error. La migración se puede volver a aplicar sin
   duplicar datos.

Lo que deja: las 10 tablas del spec con seguridad a nivel de fila, una empresa con margen general
de 20 % y vigencia de 15 días, su contador de correlativo en cero, las 12 tiendas preferidas y las
5 excluidas que lista el spec —todas con IVA incluido—, y el enlace automático de cada usuario
nuevo con esa empresa.

Para comprobar que quedó bien, en el mismo editor SQL:

```sql
select count(*) from public.tiendas;   -- 17
select nombre, margen_general, vigencia_dias from public.empresas;
```

**Nunca se aplican migraciones desde una sesión de agente.** Cada cambio de esquema es un archivo
SQL nuevo en `supabase/migrations/`, y lo aplica una persona desde el editor SQL.

### 2. Crear el primer usuario

No hay registro público: los usuarios se crean a mano.

1. En Supabase, **Authentication** → **Users** → **Add user** → **Create new user**.
2. Escribe correo y contraseña, y marca **Auto Confirm User** para no esperar el correo de
   confirmación.
3. El trigger `al_crear_usuario` crea su perfil y lo enlaza con la empresa. Para comprobarlo:

```sql
select u.email, e.nombre as empresa
from public.perfiles p
join auth.users u on u.id = p.id
join public.empresas e on e.id = p.empresa_id;
```

Si el usuario aparece sin perfil, es porque se creó antes de aplicar la migración: vuelve a
aplicarla y el enlace se arma solo.

### 3. Cargar las variables

Los nombres están en [`.env.example`](.env.example). Van en Vercel, en **Settings** →
**Environment Variables**, en los entornos **Production** y **Preview**.

| Variable | Qué lleva | Dónde se usa |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto de Supabase | Servidor y navegador |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública (`anon`) del proyecto | Servidor y navegador |
| `BUSCADOR` | `simulado` o `serpapi`. Déjalo en `simulado` | Solo servidor |
| `MODELO_EXTRACTOR` | Identificador del modelo que lee la solicitud | Solo servidor |
| `ANTHROPIC_API_KEY` | Clave de la API de Anthropic | Solo servidor |
| `SERPAPI_API_KEY` | Clave de SerpApi | Solo servidor |
| `TOPE_BUSQUEDAS_DIA` | Tope de búsquedas al día. Se entrega en `100` | Solo servidor |
| `TOPE_BUSQUEDAS_MES` | Tope de búsquedas al mes. Se entrega en `240` | Solo servidor |

El paso 1 solo usa las dos primeras. Las demás las piden los pasos 2 y 3, y conviene cargarlas
ahora para no volver.

**La clave de servicio de Supabase no se usa en ninguna parte.** La aplicación trabaja con la URL
del proyecto, la clave pública y la sesión del usuario.

`ANTHROPIC_API_KEY` y `SERPAPI_API_KEY` viven solo en el servidor: no llevan el prefijo
`NEXT_PUBLIC_`, así que nunca llegan al navegador.

Para trabajar en local, copia `.env.example` a `.env.local` y rellena los valores. `.env.local`
está en `.gitignore`: ninguna clave entra al repositorio.

## Comandos

```
npm install
npm run dev         # aplicación en local, en http://localhost:3000
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm test            # Vitest
npm run build       # construcción de producción
```

`npm run build` y `npm test` funcionan sin ninguna variable cargada: las pantallas con sesión son
dinámicas y no se prerenderizan.

### Verificar la migración contra una base local

Las pruebas de `npm test` no tocan la base de datos. Para revisar la migración hace falta un
PostgreSQL local, y nunca el proyecto de Supabase:

```bash
createdb cotizador_prueba
DATABASE_URL=postgres://postgres@localhost:5432/cotizador_prueba \
  ./scripts/verificar-migracion.sh
```

El script monta un andamio que imita el esquema `auth` y los roles de Supabase, aplica la
migración dos veces para comprobar que es idempotente, y corre las verificaciones de
`supabase/pruebas/verificar-0001.sql`: las 10 tablas con seguridad a nivel de fila, ninguna
política que alcance al rol anónimo, `empresa_id` en todas las tablas, todas las columnas de
dinero en entero, los datos iniciales, los rangos del margen, la regla de código de una
cotización aprobada, la cantidad con decimales y el trigger del usuario nuevo.

## Despliegue

Vercel, con las funciones en São Paulo. La región va en [`vercel.json`](vercel.json) como `gru1`
y no se configura desde el panel.

Cada pull request genera una vista previa de Vercel, y ahí se hace la prueba manual.

## Cómo está organizado

```
src/
  app/
    ingreso/            Pantalla de ingreso con correo y contraseña
    (app)/              Pantallas con sesión, con la navegación común
      cotizaciones/
      productos/
      configuracion/    Empresa, margen general, vigencia y tiendas
  lib/
    calculo.ts          Toda la aritmética de dinero del sistema
    datos/              Consultas a la base, filtradas por empresa_id
    supabase/           Clientes de servidor y de navegador, y el proxy
  proxy.ts              Refresca la sesión y protege las rutas
supabase/
  migrations/           Los cambios de esquema, que aplica una persona
  pruebas/              Andamio y verificaciones para una base local
scripts/
specs/
```

### Reglas que el código respeta

- **El dinero es entero en pesos chilenos.** Nunca decimales. La única cantidad con decimales es
  `lineas.cantidad`, porque el spec exige una cantidad de 0,5.
- **Toda la aritmética de dinero vive en `src/lib/calculo.ts`,** con pruebas. Ningún componente ni
  ruta calcula precios por su cuenta.
- **El margen se expresa sobre el precio de venta,** como entero de 0 % a 90 %. Con un costo de
  $1.000 y un margen de 20 %, el precio de venta neto es $1.250.
- **Todas las tablas llevan `empresa_id`,** y toda consulta se filtra por él. En `empresas`, su
  propio `id` cumple ese papel.
- **Todo límite se valida en el servidor** y devuelve un mensaje en español.
- **Las claves viven solo en el servidor.**
