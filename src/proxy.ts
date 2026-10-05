import type { NextRequest } from 'next/server'

import { actualizarSesion } from '@/lib/supabase/proxy'

/**
 * Corre antes de cada peticion: refresca la sesion de Supabase y protege las
 * rutas. En Next 16 este archivo se llama `proxy`; hasta Next 15 era
 * `middleware`.
 */
export default async function proxy(peticion: NextRequest) {
  return actualizarSesion(peticion)
}

export const config = {
  matcher: [
    // Todas las rutas menos los archivos estaticos y las imagenes.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
