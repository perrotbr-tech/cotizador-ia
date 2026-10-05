#!/usr/bin/env bash
#
# Aplica la migracion de Supabase contra una base PostgreSQL local y corre las
# verificaciones de supabase/pruebas/verificar-0001.sql.
#
# Uso:
#   DATABASE_URL=postgres://... ./scripts/verificar-migracion.sh
#
# No apunta nunca a Supabase: la base de destino se borra y se vuelve a armar.

set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Falta DATABASE_URL. Ejemplo:" >&2
  echo "  DATABASE_URL=postgres://postgres@localhost:5432/cotizador_prueba $0" >&2
  exit 1
fi

raiz="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "1. Andamio que imita a Supabase (esquema auth y roles)."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f "$raiz/supabase/pruebas/andamio.sql"

echo "2. Migracion 0001_base.sql."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f "$raiz/supabase/migrations/0001_base.sql"

echo "3. La misma migracion otra vez, para comprobar que es idempotente."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f "$raiz/supabase/migrations/0001_base.sql"

echo "4. Verificaciones."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f "$raiz/supabase/pruebas/verificar-0001.sql"
