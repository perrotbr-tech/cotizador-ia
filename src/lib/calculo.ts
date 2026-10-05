/**
 * Toda la aritmetica de dinero del sistema vive en este archivo.
 * Ningun componente ni ruta calcula precios por su cuenta.
 *
 * Reglas, de la seccion "Reglas de negocio" de specs/SPEC-MVP.md:
 *  - Todos los montos son enteros en pesos chilenos. Nunca decimales para dinero.
 *  - El margen se expresa sobre el precio de venta, no sobre el costo.
 *  - Los redondeos son al peso.
 */

/** Tasa del IVA en Chile, en puntos porcentuales. */
export const PORCENTAJE_IVA = 19

/** El margen permitido va de 0 % a 90 %. */
export const MARGEN_MINIMO = 0
export const MARGEN_MAXIMO = 90

/** Dias de vigencia que se entregan de fabrica. */
export const VIGENCIA_DIAS_POR_DEFECTO = 15

/**
 * Redondea al peso, con el medio hacia arriba en valor absoluto
 * (0,5 sube a 1; -0,5 baja a -1).
 */
export function redondearAPeso(valor: number): number {
  if (!Number.isFinite(valor)) {
    throw new Error('No se puede redondear un valor que no es un numero finito.')
  }
  return Math.sign(valor) * Math.round(Math.abs(valor))
}

/** Un monto de dinero valido: entero, finito y no negativo. */
export function esMontoValido(valor: number): boolean {
  return Number.isInteger(valor) && valor >= 0
}

/** Un margen valido: entero de 0 a 90. */
export function esMargenValido(margen: number): boolean {
  return Number.isInteger(margen) && margen >= MARGEN_MINIMO && margen <= MARGEN_MAXIMO
}

/** Una cantidad valida: finita y mayor que cero. Puede tener decimales. */
export function esCantidadValida(cantidad: number): boolean {
  return Number.isFinite(cantidad) && cantidad > 0
}

function exigirMonto(valor: number, nombre: string): void {
  if (!esMontoValido(valor)) {
    throw new Error(`${nombre} debe ser un entero en pesos mayor o igual a cero.`)
  }
}

function exigirMargen(margen: number): void {
  if (!esMargenValido(margen)) {
    throw new Error(
      `El margen debe ser un entero entre ${MARGEN_MINIMO} % y ${MARGEN_MAXIMO} %.`,
    )
  }
}

function exigirCantidad(cantidad: number): void {
  if (!esCantidadValida(cantidad)) {
    throw new Error('La cantidad debe ser un numero mayor que cero.')
  }
}

/**
 * Pasa el precio publicado por una tienda a costo neto.
 *
 * Tienda que publica con IVA incluido: costo neto = precio publicado / 1,19,
 * redondeado al peso. Se divide como 100/119 para no arrastrar el error del
 * literal 1,19 en punto flotante.
 *
 * Tienda que publica sin IVA: el precio publicado ya es el costo neto.
 */
export function costoNetoDesdePrecioPublicado(
  precioPublicado: number,
  publicaConIva: boolean,
): number {
  exigirMonto(precioPublicado, 'El precio publicado')
  if (!publicaConIva) {
    return precioPublicado
  }
  return redondearAPeso((precioPublicado * 100) / (100 + PORCENTAJE_IVA))
}

/**
 * Pasa a costo neto un costo que el cotizador ingresa a mano,
 * segun si declaro que el valor es neto o con IVA.
 */
export function costoNetoDesdeCostoManual(costo: number, incluyeIva: boolean): number {
  exigirMonto(costo, 'El costo ingresado')
  if (!incluyeIva) {
    return costo
  }
  return redondearAPeso((costo * 100) / (100 + PORCENTAJE_IVA))
}

/**
 * Precio de venta neto unitario = costo neto unitario / (1 - margen),
 * redondeado al peso. El margen entra en puntos porcentuales enteros, asi que
 * la division se hace como 100/(100 - margen) y no arrastra error de punto
 * flotante.
 *
 * Con costo de $1.000 y margen de 20 %, el precio de venta neto es $1.250.
 */
export function precioVentaNetoUnitario(
  costoNetoUnitario: number,
  margen: number,
): number {
  exigirMonto(costoNetoUnitario, 'El costo neto unitario')
  exigirMargen(margen)
  return redondearAPeso((costoNetoUnitario * 100) / (100 - margen))
}

/**
 * Total neto de la linea = precio de venta neto unitario x cantidad,
 * redondeado al peso. La cantidad puede tener decimales.
 */
export function totalNetoLinea(
  precioVentaNetoUnitarioLinea: number,
  cantidad: number,
): number {
  exigirMonto(precioVentaNetoUnitarioLinea, 'El precio de venta neto unitario')
  exigirCantidad(cantidad)
  return redondearAPeso(precioVentaNetoUnitarioLinea * cantidad)
}

export type TotalesCotizacion = {
  /** Suma de los totales netos de las lineas. */
  totalNeto: number
  /** 19 % del total neto, redondeado al peso. */
  iva: number
  /** Total neto mas IVA. */
  total: number
}

/**
 * Totales de la cotizacion a partir de los totales netos de sus lineas.
 * Una cotizacion sin lineas da todo en cero.
 */
export function totalesCotizacion(totalesNetosDeLineas: readonly number[]): TotalesCotizacion {
  let totalNeto = 0
  for (const totalDeLinea of totalesNetosDeLineas) {
    exigirMonto(totalDeLinea, 'El total neto de una linea')
    totalNeto += totalDeLinea
  }
  const iva = redondearAPeso((totalNeto * PORCENTAJE_IVA) / 100)
  return { totalNeto, iva, total: totalNeto + iva }
}

/**
 * Calcula de una vez los tres montos de una linea a partir de su costo neto
 * unitario, su margen y su cantidad.
 */
export function calcularLinea(
  costoNetoUnitario: number,
  margen: number,
  cantidad: number,
): { costoNetoUnitario: number; precioVentaNetoUnitario: number; totalNeto: number } {
  const precioVenta = precioVentaNetoUnitario(costoNetoUnitario, margen)
  return {
    costoNetoUnitario,
    precioVentaNetoUnitario: precioVenta,
    totalNeto: totalNetoLinea(precioVenta, cantidad),
  }
}
