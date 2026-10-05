import {
  listarTiendas,
  obtenerEmpresa,
  obtenerEmpresaIdDelUsuario,
} from '@/lib/datos/empresa'
import type { Empresa, Tienda } from '@/lib/datos/tipos'

import { FormularioDeEmpresa } from './formulario-empresa'
import { FormularioDeTiendas } from './formulario-tiendas'

export const metadata = { title: 'Configuración · Cotizador IA' }

type Configuracion =
  | { ok: true; empresa: Empresa; tiendas: Tienda[] }
  | { ok: false; mensaje: string }

/**
 * Lee la configuracion de la empresa del usuario. Devuelve el problema como
 * valor en vez de lanzarlo, para que la pantalla muestre un mensaje claro
 * cuando todavia falta aplicar la migracion.
 */
async function leerConfiguracion(): Promise<Configuracion> {
  try {
    const empresaId = await obtenerEmpresaIdDelUsuario()
    const [empresa, tiendas] = await Promise.all([
      obtenerEmpresa(empresaId),
      listarTiendas(empresaId),
    ])
    return { ok: true, empresa, tiendas }
  } catch (problema) {
    return {
      ok: false,
      mensaje:
        problema instanceof Error ? problema.message : 'No pudimos leer la configuración.',
    }
  }
}

export default async function PaginaConfiguracion() {
  const configuracion = await leerConfiguracion()

  return (
    <>
      <h1>Configuración</h1>
      <p className="subtitulo">
        Datos de la empresa, margen general, vigencia de la cotización y lista de tiendas.
      </p>

      {configuracion.ok ? (
        <>
          <FormularioDeEmpresa empresa={configuracion.empresa} />
          <FormularioDeTiendas tiendas={configuracion.tiendas} />
        </>
      ) : (
        <p className="aviso aviso--error" role="alert">
          {configuracion.mensaje}
        </p>
      )}
    </>
  )
}
