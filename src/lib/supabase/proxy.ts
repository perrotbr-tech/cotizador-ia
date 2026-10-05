import { NextResponse, type NextRequest } from 'next/server'

import { createServerClient } from '@supabase/ssr'

import { leerEntornoSupabase } from './entorno'

/** Rutas que se ven sin sesion iniciada. */
const RUTAS_PUBLICAS = ['/ingreso']

function esRutaPublica(ruta: string): boolean {
  return RUTAS_PUBLICAS.some((publica) => ruta === publica || ruta.startsWith(`${publica}/`))
}

/**
 * Refresca la sesion en cada peticion y protege las rutas.
 *
 * Sin sesion, cualquier ruta que no sea publica manda a /ingreso.
 * Con sesion, /ingreso manda a /cotizaciones.
 */
export async function actualizarSesion(peticion: NextRequest): Promise<NextResponse> {
  let respuesta = NextResponse.next({ request: peticion })

  const { url, claveAnonima } = leerEntornoSupabase()

  const supabase = createServerClient(url, claveAnonima, {
    cookies: {
      getAll() {
        return peticion.cookies.getAll()
      },
      setAll(cookiesPorEscribir, cabeceras) {
        for (const { name, value } of cookiesPorEscribir) {
          peticion.cookies.set(name, value)
        }
        respuesta = NextResponse.next({ request: peticion })
        for (const { name, value, options } of cookiesPorEscribir) {
          respuesta.cookies.set(name, value, options)
        }
        for (const [nombre, valor] of Object.entries(cabeceras)) {
          respuesta.headers.set(nombre, valor)
        }
      },
    },
  })

  const {
    data: { user: usuario },
  } = await supabase.auth.getUser()

  const ruta = peticion.nextUrl.pathname

  if (!usuario && !esRutaPublica(ruta)) {
    const destino = peticion.nextUrl.clone()
    destino.pathname = '/ingreso'
    destino.search = ''
    return NextResponse.redirect(destino)
  }

  if (usuario && esRutaPublica(ruta)) {
    const destino = peticion.nextUrl.clone()
    destino.pathname = '/cotizaciones'
    destino.search = ''
    return NextResponse.redirect(destino)
  }

  return respuesta
}
