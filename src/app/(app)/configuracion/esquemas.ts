import { z } from 'zod'

import { MARGEN_MAXIMO, MARGEN_MINIMO } from '@/lib/calculo'
import { ESTADOS_DE_TIENDA } from '@/lib/datos/tipos'

/** Dias de vigencia que acepta la configuracion. */
export const VIGENCIA_DIAS_MINIMA = 1
export const VIGENCIA_DIAS_MAXIMA = 365

/**
 * Entero obligatorio dentro de un rango, con un mensaje unico en espanol para
 * todos los modos de falla: vacio, texto, decimal y fuera de rango.
 */
function enteroEnRango(minimo: number, maximo: number, mensaje: string) {
  return z.preprocess(
    (valor) => (typeof valor === 'string' && valor.trim() === '' ? Number.NaN : valor),
    z.coerce.number({ error: mensaje }).int(mensaje).min(minimo, mensaje).max(maximo, mensaje),
  )
}

/** Texto que puede venir vacio. Vacio se guarda como nulo. */
function textoOpcional(maximo: number, mensaje: string) {
  return z
    .string({ error: mensaje })
    .trim()
    .max(maximo, mensaje)
    .transform((valor) => (valor === '' ? null : valor))
}

export const esquemaDeEmpresa = z.object({
  nombre: z
    .string({ error: 'El nombre de la empresa es obligatorio.' })
    .trim()
    .min(1, 'El nombre de la empresa es obligatorio.')
    .max(200, 'El nombre de la empresa no puede pasar de 200 caracteres.'),
  rut: textoOpcional(20, 'El RUT no puede pasar de 20 caracteres.'),
  direccion: textoOpcional(200, 'La dirección no puede pasar de 200 caracteres.'),
  correo: z
    .union([z.literal(''), z.string().trim().email('El correo no tiene un formato válido.')])
    .transform((valor) => (valor === '' ? null : valor.trim())),
  telefono: textoOpcional(40, 'El teléfono no puede pasar de 40 caracteres.'),
  condiciones_comerciales: textoOpcional(
    2000,
    'Las condiciones comerciales no pueden pasar de 2.000 caracteres.',
  ),
  margen_general: enteroEnRango(
    MARGEN_MINIMO,
    MARGEN_MAXIMO,
    `El margen general debe ser un número entero entre ${MARGEN_MINIMO} % y ${MARGEN_MAXIMO} %.`,
  ),
  vigencia_dias: enteroEnRango(
    VIGENCIA_DIAS_MINIMA,
    VIGENCIA_DIAS_MAXIMA,
    `La vigencia debe ser un número entero de días entre ${VIGENCIA_DIAS_MINIMA} y ${VIGENCIA_DIAS_MAXIMA}.`,
  ),
})

export type DatosDeEmpresa = z.output<typeof esquemaDeEmpresa>

export const esquemaDeTienda = z.object({
  id: z.string({ error: 'Falta el identificador de la tienda.' }).uuid('La tienda no es válida.'),
  estado: z.enum(ESTADOS_DE_TIENDA, { error: 'El estado de la tienda no es válido.' }),
  publica_con_iva: z.enum(['si', 'no'], {
    error: 'El dato de IVA de la tienda no es válido.',
  }),
})

export const esquemaDeTiendas = z
  .array(esquemaDeTienda)
  .min(1, 'No llegó ninguna tienda para guardar.')
  .max(500, 'Llegaron demasiadas tiendas en una sola petición.')
