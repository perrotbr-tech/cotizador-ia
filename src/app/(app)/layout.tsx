import { redirect } from 'next/navigation'

import { crearClienteServidor } from '@/lib/supabase/servidor'

import { cerrarSesion } from './acciones-sesion'
import { Navegacion } from './navegacion'

export default async function LayoutDeLaAplicacion({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await crearClienteServidor()

  const {
    data: { user: usuario },
  } = await supabase.auth.getUser()

  if (!usuario) {
    redirect('/ingreso')
  }

  return (
    <>
      <header className="encabezado">
        <div className="encabezado__interior">
          <span className="marca">
            Cotizador IA
            <span className="marca__detalle">Perrot Tech</span>
          </span>

          <Navegacion />

          <div className="sesion">
            <span>{usuario.email}</span>
            <form action={cerrarSesion}>
              <button className="boton--discreto" type="submit">
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="contenido">{children}</main>
    </>
  )
}
