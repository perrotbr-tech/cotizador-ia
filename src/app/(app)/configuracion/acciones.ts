'use server'

import { revalidatePath } from 'next/cache'

import { obtenerEmpresaIdDelUsuario } from '@/lib/datos/empresa'
import { crearClienteServidor } from '@/lib/supabase/servidor'

import { esquemaDeEmpresa, esquemaDeTiendas } from './esquemas'

export type ResultadoDeGuardado = { ok: boolean; mensaje: string }

/**
 * Guarda los datos de la empresa, el margen general y la vigencia.
 * Todos los limites se validan aqui, en el servidor.
 */
export async function guardarEmpresa(
  _estadoPrevio: ResultadoDeGuardado | null,
  formulario: FormData,
): Promise<ResultadoDeGuardado> {
  const revisado = esquemaDeEmpresa.safeParse({
    nombre: formulario.get('nombre'),
    rut: formulario.get('rut'),
    direccion: formulario.get('direccion'),
    correo: formulario.get('correo'),
    telefono: formulario.get('telefono'),
    condiciones_comerciales: formulario.get('condiciones_comerciales'),
    margen_general: formulario.get('margen_general'),
    vigencia_dias: formulario.get('vigencia_dias'),
  })

  if (!revisado.success) {
    return { ok: false, mensaje: revisado.error.issues[0]?.message ?? 'Hay datos no válidos.' }
  }

  try {
    const empresaId = await obtenerEmpresaIdDelUsuario()
    const supabase = await crearClienteServidor()

    const { error } = await supabase
      .from('empresas')
      .update(revisado.data)
      .eq('id', empresaId)

    if (error) {
      return { ok: false, mensaje: 'No pudimos guardar los datos de la empresa.' }
    }
  } catch (problema) {
    return { ok: false, mensaje: mensajeDeError(problema) }
  }

  revalidatePath('/configuracion')
  return { ok: true, mensaje: 'Datos de la empresa guardados.' }
}

/**
 * Guarda el estado y el dato de IVA de cada tienda. Cada fila se actualiza
 * filtrando por `empresa_id`, de modo que una tienda de otra empresa no se
 * puede tocar desde aqui.
 */
export async function guardarTiendas(
  _estadoPrevio: ResultadoDeGuardado | null,
  formulario: FormData,
): Promise<ResultadoDeGuardado> {
  const identificadores = formulario.getAll('tienda_id').map(String)

  const revisado = esquemaDeTiendas.safeParse(
    identificadores.map((id) => ({
      id,
      estado: formulario.get(`estado__${id}`),
      publica_con_iva: formulario.get(`iva__${id}`),
    })),
  )

  if (!revisado.success) {
    return { ok: false, mensaje: revisado.error.issues[0]?.message ?? 'Hay datos no válidos.' }
  }

  try {
    const empresaId = await obtenerEmpresaIdDelUsuario()
    const supabase = await crearClienteServidor()

    for (const tienda of revisado.data) {
      const { error } = await supabase
        .from('tiendas')
        .update({
          estado: tienda.estado,
          publica_con_iva: tienda.publica_con_iva === 'si',
        })
        .eq('id', tienda.id)
        .eq('empresa_id', empresaId)

      if (error) {
        return { ok: false, mensaje: 'No pudimos guardar la lista de tiendas.' }
      }
    }
  } catch (problema) {
    return { ok: false, mensaje: mensajeDeError(problema) }
  }

  revalidatePath('/configuracion')
  return {
    ok: true,
    mensaje: `Se guardaron ${revisado.data.length} tiendas.`,
  }
}

function mensajeDeError(problema: unknown): string {
  return problema instanceof Error
    ? problema.message
    : 'No pudimos guardar los cambios. Intenta de nuevo.'
}
