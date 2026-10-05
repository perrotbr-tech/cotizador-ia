#!/usr/bin/env bash
#
# Aplica la migracion de Supabase contra una base PostgreSQL local y corre las
# verificaciones de supabase/pruebas/.
#
# Uso:
#   DATABASE_URL=postgres://... ./scripts/verificar-migracion.sh
#
# No apunta nunca a Supabase: escribe y borra datos de prueba en la base de
# destino, que tiene que estar vacia para que el paso 2 pueda crear un usuario
# anterior a la primera aplicacion de la migracion.

set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Falta DATABASE_URL. Ejemplo:" >&2
  echo "  DATABASE_URL=postgres://postgres@localhost:5432/cotizador_prueba $0" >&2
  exit 1
fi

raiz="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "1. Andamio que imita a Supabase (esquema auth y roles)."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f "$raiz/supabase/pruebas/andamio.sql"

echo "2. Un usuario creado antes de aplicar la migracion por primera vez."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f "$raiz/supabase/pruebas/usuario-previo.sql"

echo "3. Migracion 0001_base.sql."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f "$raiz/supabase/migrations/0001_base.sql"

echo "4. La misma migracion otra vez, para comprobar que es idempotente."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f "$raiz/supabase/migrations/0001_base.sql"

echo "5. Verificaciones."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f "$raiz/supabase/pruebas/verificar-0001.sql"

echo "6. El usuario que ya existia quedo enlazado con la empresa."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f "$raiz/supabase/pruebas/verificar-usuario-previo.sql"
