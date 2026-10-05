import 'server-only'

import { crearClienteServidor } from '@/lib/supabase/servidor'

import type { Empresa, Tienda } from './tipos'

const COLUMNAS_DE_EMPRESA =
  'id, nombre, rut, direccion, correo, telefono, condiciones_comerciales, margen_general, vigencia_dias'

/**
 * Devuelve el `empresa_id` del usuario con sesion iniciada, tomado de su
 * perfil. Todas las consultas de la aplicacion se filtran con este valor.
 */
export async function obtenerEmpresaIdDelUsuario(): Promise<string> {
  const supabase = await crearClienteServidor()

  const {
    data: { user: usuario },
  } = await supabase.auth.getUser()

  if (!usuario) {
    throw new Error('No hay una sesion iniciada.')
  }

  const { data, error } = await supabase
    .from('perfiles')
    .select('empresa_id')
    .eq('id', usuario.id)
    .single()

  if (error || !data) {
    throw new Error(
      'Tu usuario no está enlazado a ninguna empresa. Aplica la migración 0001_base.sql ' +
        'en Supabase y vuelve a crear el usuario.',
    )
  }

  return data.empresa_id as string
}

export async function obtenerEmpresa(empresaId: string): Promise<Empresa> {
  const supabase = await crearClienteServidor()

  const { data, error } = await supabase
    .from('empresas')
    .select(COLUMNAS_DE_EMPRESA)
    .eq('id', empresaId)
    .single<Empresa>()

  if (error || !data) {
    throw new Error('No pudimos leer los datos de la empresa.')
  }

  return data
}

export async function listarTiendas(empresaId: string): Promise<Tienda[]> {
  const supabase = await crearClienteServidor()

  const { data, error } = await supabase
    .from('tiendas')
    .select('id, nombre, alias, estado, publica_con_iva')
    .eq('empresa_id', empresaId)
    .order('nombre', { ascending: true })

  if (error) {
    throw new Error('No pudimos leer la lista de tiendas.')
  }

  return (data ?? []) as Tienda[]
}
