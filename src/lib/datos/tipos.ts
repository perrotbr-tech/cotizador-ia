/**
 * Tipos y constantes de los datos, sin ninguna dependencia de servidor.
 *
 * Este archivo lo pueden importar tanto los componentes de servidor como los
 * de navegador. Las consultas a la base viven en los modulos de al lado, que
 * si son de servidor.
 */

export const ESTADOS_DE_TIENDA = ['preferida', 'sin_clasificar', 'excluida'] as const
export type EstadoDeTienda = (typeof ESTADOS_DE_TIENDA)[number]

export const NOMBRE_DEL_ESTADO: Record<EstadoDeTienda, string> = {
  preferida: 'Preferida',
  sin_clasificar: 'Sin clasificar',
  excluida: 'Excluida',
}

export type Empresa = {
  id: string
  nombre: string
  rut: string | null
  direccion: string | null
  correo: string | null
  telefono: string | null
  condiciones_comerciales: string | null
  margen_general: number
  vigencia_dias: number
}

export type Tienda = {
  id: string
  nombre: string
  alias: string
  estado: EstadoDeTienda
  publica_con_iva: boolean
}
