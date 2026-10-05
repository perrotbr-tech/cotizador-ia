import { describe, expect, it } from 'vitest'

import {
  MARGEN_MAXIMO,
  MARGEN_MINIMO,
  PORCENTAJE_IVA,
  calcularLinea,
  costoNetoDesdeCostoManual,
  costoNetoDesdePrecioPublicado,
  esCantidadValida,
  esMargenValido,
  esMontoValido,
  precioVentaNetoUnitario,
  redondearAPeso,
  totalNetoLinea,
  totalesCotizacion,
} from './calculo'

describe('redondearAPeso', () => {
  it('deja los enteros como estan', () => {
    expect(redondearAPeso(0)).toBe(0)
    expect(redondearAPeso(1250)).toBe(1250)
  })

  it('sube el medio peso hacia arriba', () => {
    expect(redondearAPeso(0.5)).toBe(1)
    expect(redondearAPeso(1.5)).toBe(2)
    expect(redondearAPeso(2.5)).toBe(3)
    expect(redondearAPeso(625.5)).toBe(626)
  })

  it('baja lo que esta por debajo del medio peso', () => {
    expect(redondearAPeso(0.49)).toBe(0)
    expect(redondearAPeso(839.4957983193277)).toBe(839)
  })

  it('redondea el medio hacia arriba en valor absoluto', () => {
    expect(redondearAPeso(-0.5)).toBe(-1)
    expect(redondearAPeso(-1.5)).toBe(-2)
  })

  it('rechaza lo que no es un numero finito', () => {
    expect(() => redondearAPeso(Number.NaN)).toThrow()
    expect(() => redondearAPeso(Number.POSITIVE_INFINITY)).toThrow()
  })
})

describe('costoNetoDesdePrecioPublicado', () => {
  it('saca el IVA cuando la tienda publica con IVA incluido', () => {
    expect(costoNetoDesdePrecioPublicado(1190, true)).toBe(1000)
    expect(costoNetoDesdePrecioPublicado(11900, true)).toBe(10000)
  })

  it('deja el precio tal cual cuando la tienda publica sin IVA', () => {
    expect(costoNetoDesdePrecioPublicado(1000, false)).toBe(1000)
    expect(costoNetoDesdePrecioPublicado(1, false)).toBe(1)
  })

  it('redondea al peso', () => {
    // 100000 / 119 = 840,3361...
    expect(costoNetoDesdePrecioPublicado(1000, true)).toBe(840)
    // 99900 / 119 = 839,4957...
    expect(costoNetoDesdePrecioPublicado(999, true)).toBe(839)
    // 9900 / 119 = 83,1932...
    expect(costoNetoDesdePrecioPublicado(99, true)).toBe(83)
  })

  it('maneja un precio publicado de $1', () => {
    // 100 / 119 = 0,8403... sube a 1
    expect(costoNetoDesdePrecioPublicado(1, true)).toBe(1)
  })

  it('acepta el cero', () => {
    expect(costoNetoDesdePrecioPublicado(0, true)).toBe(0)
  })

  it('rechaza montos que no son enteros en pesos', () => {
    expect(() => costoNetoDesdePrecioPublicado(1190.5, true)).toThrow()
    expect(() => costoNetoDesdePrecioPublicado(-1, true)).toThrow()
  })
})

describe('costoNetoDesdeCostoManual', () => {
  it('saca el IVA cuando el cotizador declara que el valor lo incluye', () => {
    expect(costoNetoDesdeCostoManual(1190, true)).toBe(1000)
  })

  it('deja el valor tal cual cuando el cotizador declara que es neto', () => {
    expect(costoNetoDesdeCostoManual(1000, false)).toBe(1000)
  })
})

describe('precioVentaNetoUnitario', () => {
  it('cumple el ejemplo del spec: $1.000 con 20 % da $1.250', () => {
    expect(precioVentaNetoUnitario(1000, 20)).toBe(1250)
  })

  it('con margen de 0 % el precio de venta es el costo', () => {
    expect(precioVentaNetoUnitario(1000, MARGEN_MINIMO)).toBe(1000)
    expect(precioVentaNetoUnitario(1, MARGEN_MINIMO)).toBe(1)
    expect(precioVentaNetoUnitario(0, MARGEN_MINIMO)).toBe(0)
  })

  it('con margen de 90 % el precio de venta es diez veces el costo', () => {
    expect(precioVentaNetoUnitario(1000, MARGEN_MAXIMO)).toBe(10000)
    expect(precioVentaNetoUnitario(1, MARGEN_MAXIMO)).toBe(10)
    expect(precioVentaNetoUnitario(3333, MARGEN_MAXIMO)).toBe(33330)
  })

  it('el margen efectivo se cumple sobre el precio de venta', () => {
    const costo = 1000
    const margen = 20
    const venta = precioVentaNetoUnitario(costo, margen)
    expect((venta - costo) / venta).toBeCloseTo(margen / 100, 10)
  })

  it('redondea al peso, con el medio hacia arriba', () => {
    // 2 x 100 / 80 = 2,5 sube a 3
    expect(precioVentaNetoUnitario(2, 20)).toBe(3)
    // 1 x 100 / 80 = 1,25 baja a 1
    expect(precioVentaNetoUnitario(1, 20)).toBe(1)
    // 1000 x 100 / 97 = 1030,927...
    expect(precioVentaNetoUnitario(1000, 3)).toBe(1031)
    // 7 x 100 / 70 = 10
    expect(precioVentaNetoUnitario(7, 30)).toBe(10)
  })

  it('rechaza un margen fuera del rango de 0 % a 90 %', () => {
    expect(() => precioVentaNetoUnitario(1000, -1)).toThrow()
    expect(() => precioVentaNetoUnitario(1000, 91)).toThrow()
    expect(() => precioVentaNetoUnitario(1000, 100)).toThrow()
  })

  it('rechaza un margen que no es entero', () => {
    expect(() => precioVentaNetoUnitario(1000, 20.5)).toThrow()
  })

  it('rechaza un costo que no es entero en pesos', () => {
    expect(() => precioVentaNetoUnitario(1000.5, 20)).toThrow()
    expect(() => precioVentaNetoUnitario(-1000, 20)).toThrow()
  })
})

describe('totalNetoLinea', () => {
  it('multiplica el precio unitario por la cantidad', () => {
    expect(totalNetoLinea(1250, 1)).toBe(1250)
    expect(totalNetoLinea(1250, 4)).toBe(5000)
    expect(totalNetoLinea(1250, 200)).toBe(250000)
  })

  it('acepta cantidad con decimales', () => {
    expect(totalNetoLinea(1250, 0.5)).toBe(625)
    expect(totalNetoLinea(1250, 2.5)).toBe(3125)
    expect(totalNetoLinea(1250, 0.25)).toBe(313)
  })

  it('redondea al peso cuando la cantidad decimal deja medio peso', () => {
    // 1251 x 0,5 = 625,5 sube a 626
    expect(totalNetoLinea(1251, 0.5)).toBe(626)
    // 333 x 1,5 = 499,5 sube a 500
    expect(totalNetoLinea(333, 1.5)).toBe(500)
  })

  it('rechaza una cantidad de cero o negativa', () => {
    expect(() => totalNetoLinea(1250, 0)).toThrow()
    expect(() => totalNetoLinea(1250, -1)).toThrow()
  })
})

describe('totalesCotizacion', () => {
  it('una cotizacion sin lineas da todo en cero', () => {
    expect(totalesCotizacion([])).toEqual({ totalNeto: 0, iva: 0, total: 0 })
  })

  it('el total neto es la suma de las lineas y el total es el neto mas el 19 %', () => {
    const totales = totalesCotizacion([1250, 5000, 625])
    expect(totales.totalNeto).toBe(6875)
    expect(totales.iva).toBe(1306) // 6875 x 0,19 = 1306,25 baja a 1306
    expect(totales.total).toBe(8181)
  })

  it('redondea el IVA al peso, con el medio hacia arriba', () => {
    // 50 x 0,19 = 9,5 sube a 10
    expect(totalesCotizacion([50])).toEqual({ totalNeto: 50, iva: 10, total: 60 })
    // 1000 x 0,19 = 190 exacto
    expect(totalesCotizacion([1000])).toEqual({ totalNeto: 1000, iva: 190, total: 1190 })
    // 1 x 0,19 = 0,19 baja a 0
    expect(totalesCotizacion([1])).toEqual({ totalNeto: 1, iva: 0, total: 1 })
  })

  it('el total neto coincide al peso con la suma de los totales de las lineas', () => {
    const lineas = [1, 7, 13, 999, 100001, 625, 3125]
    const totales = totalesCotizacion(lineas)
    expect(totales.totalNeto).toBe(lineas.reduce((suma, valor) => suma + valor, 0))
    expect(totales.total).toBe(totales.totalNeto + totales.iva)
    expect(totales.iva).toBe(redondearAPeso((totales.totalNeto * PORCENTAJE_IVA) / 100))
  })

  it('todos los montos salen enteros', () => {
    const totales = totalesCotizacion([1250, 5000, 625])
    expect(Number.isInteger(totales.totalNeto)).toBe(true)
    expect(Number.isInteger(totales.iva)).toBe(true)
    expect(Number.isInteger(totales.total)).toBe(true)
  })

  it('rechaza un total de linea que no es entero en pesos', () => {
    expect(() => totalesCotizacion([1250.5])).toThrow()
  })
})

describe('calcularLinea', () => {
  it('recorre el camino completo del spec: publicado con IVA, margen y cantidad', () => {
    const costoNeto = costoNetoDesdePrecioPublicado(1190, true)
    expect(costoNeto).toBe(1000)

    const linea = calcularLinea(costoNeto, 20, 4)
    expect(linea).toEqual({
      costoNetoUnitario: 1000,
      precioVentaNetoUnitario: 1250,
      totalNeto: 5000,
    })

    expect(totalesCotizacion([linea.totalNeto])).toEqual({
      totalNeto: 5000,
      iva: 950,
      total: 5950,
    })
  })

  it('funciona con cantidad decimal', () => {
    expect(calcularLinea(1000, 20, 0.5)).toEqual({
      costoNetoUnitario: 1000,
      precioVentaNetoUnitario: 1250,
      totalNeto: 625,
    })
  })
})

describe('validaciones', () => {
  it('esMontoValido acepta solo enteros no negativos', () => {
    expect(esMontoValido(0)).toBe(true)
    expect(esMontoValido(1250)).toBe(true)
    expect(esMontoValido(-1)).toBe(false)
    expect(esMontoValido(1250.5)).toBe(false)
    expect(esMontoValido(Number.NaN)).toBe(false)
  })

  it('esMargenValido acepta solo enteros de 0 a 90', () => {
    expect(esMargenValido(0)).toBe(true)
    expect(esMargenValido(20)).toBe(true)
    expect(esMargenValido(90)).toBe(true)
    expect(esMargenValido(91)).toBe(false)
    expect(esMargenValido(-1)).toBe(false)
    expect(esMargenValido(20.5)).toBe(false)
  })

  it('esCantidadValida acepta decimales mayores que cero', () => {
    expect(esCantidadValida(0.5)).toBe(true)
    expect(esCantidadValida(1)).toBe(true)
    expect(esCantidadValida(0)).toBe(false)
    expect(esCantidadValida(-1)).toBe(false)
    expect(esCantidadValida(Number.NaN)).toBe(false)
  })
})
