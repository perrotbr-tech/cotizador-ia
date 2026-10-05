import { cookies } from 'next/headers'

import { createServerClient } from '@supabase/ssr'

import { leerEntornoSupabase } from './entorno'

/**
 * Cliente de Supabase para componentes y acciones de servidor. Se crea uno
 * nuevo por cada render: nunca se comparte entre peticiones.
 *
 * El `await cookies()` va primero a proposito: deja la ruta marcada como
 * dinamica antes de leer el entorno, de modo que `next build` no intente
 * prerenderizar una pantalla con sesion ni necesite las variables cargadas.
 *
 * Los componentes de servidor no pueden escribir cookies, asi que `setAll`
 * ignora el error. El refresco de la sesion lo hace el middleware.
 */
export async function crearClienteServidor() {
  const almacenDeCookies = await cookies()
  const { url, claveAnonima } = leerEntornoSupabase()

  return createServerClient(url, claveAnonima, {
    cookies: {
      getAll() {
        return almacenDeCookies.getAll()
      },
      setAll(cookiesPorEscribir) {
        try {
          for (const { name, value, options } of cookiesPorEscribir) {
            almacenDeCookies.set(name, value, options)
          }
        } catch {
          // Un componente de servidor no puede escribir cookies. El middleware
          // ya refresco la sesion en esta misma peticion.
        }
      },
    },
  })
}
