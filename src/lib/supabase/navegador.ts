'use client'

import { createBrowserClient } from '@supabase/ssr'

import { leerEntornoSupabase } from './entorno'

/**
 * Cliente de Supabase para el navegador. Usa solo la URL del proyecto y la
 * clave publica, con la sesion del usuario. La clave de servicio no se usa.
 *
 * Se llama dentro de un manejador de evento, no al cargar el modulo, para que
 * el prerenderizado de `next build` no necesite las variables.
 */
export function crearClienteNavegador() {
  const { url, claveAnonima } = leerEntornoSupabase()
  return createBrowserClient(url, claveAnonima)
}
