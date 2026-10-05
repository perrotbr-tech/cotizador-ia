/**
 * Lee las dos variables publicas de Supabase.
 *
 * Se leen dentro de una funcion, no al cargar el modulo, para que
 * `next build` termine en un entorno sin variables cargadas. El error
 * aparece recien cuando alguien intenta usar la conexion.
 */
export type EntornoSupabase = { url: string; claveAnonima: string }

export function leerEntornoSupabase(): EntornoSupabase {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const claveAnonima = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !claveAnonima) {
    throw new Error(
      'Faltan las variables NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
        'Cargalas en Vercel o en el archivo .env.local.',
    )
  }

  return { url, claveAnonima }
}
