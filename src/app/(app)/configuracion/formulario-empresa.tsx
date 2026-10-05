'use client'

import { useActionState } from 'react'

import { MARGEN_MAXIMO, MARGEN_MINIMO } from '@/lib/calculo'
import type { Empresa } from '@/lib/datos/tipos'

import { guardarEmpresa, type ResultadoDeGuardado } from './acciones'
import { VIGENCIA_DIAS_MAXIMA, VIGENCIA_DIAS_MINIMA } from './esquemas'

export function FormularioDeEmpresa({ empresa }: { empresa: Empresa }) {
  const [resultado, enviar, enviando] = useActionState<ResultadoDeGuardado | null, FormData>(
    guardarEmpresa,
    null,
  )

  return (
    <form action={enviar} className="tarjeta">
      <h2>Datos de la empresa</h2>
      <p className="pista">Es lo que sale en el documento que recibe el cliente final.</p>

      <Aviso resultado={resultado} />

      <div className="campos">
        <div className="campo campo--ancho">
          <label htmlFor="nombre">Nombre</label>
          <input defaultValue={empresa.nombre} id="nombre" name="nombre" required />
        </div>

        <div className="campo">
          <label htmlFor="rut">RUT</label>
          <input defaultValue={empresa.rut ?? ''} id="rut" name="rut" />
        </div>

        <div className="campo">
          <label htmlFor="telefono">Teléfono</label>
          <input defaultValue={empresa.telefono ?? ''} id="telefono" name="telefono" />
        </div>

        <div className="campo">
          <label htmlFor="correo">Correo</label>
          <input defaultValue={empresa.correo ?? ''} id="correo" name="correo" type="email" />
        </div>

        <div className="campo campo--ancho">
          <label htmlFor="direccion">Dirección</label>
          <input defaultValue={empresa.direccion ?? ''} id="direccion" name="direccion" />
        </div>

        <div className="campo campo--ancho">
          <label htmlFor="condiciones_comerciales">Condiciones comerciales</label>
          <textarea
            defaultValue={empresa.condiciones_comerciales ?? ''}
            id="condiciones_comerciales"
            name="condiciones_comerciales"
          />
        </div>

        <div className="campo">
          <label htmlFor="margen_general">Margen general</label>
          <input
            defaultValue={empresa.margen_general}
            id="margen_general"
            max={MARGEN_MAXIMO}
            min={MARGEN_MINIMO}
            name="margen_general"
            required
            step={1}
            type="number"
          />
          <span className="pista">
            Porcentaje sobre el precio de venta, de {MARGEN_MINIMO} % a {MARGEN_MAXIMO} %.
          </span>
        </div>

        <div className="campo">
          <label htmlFor="vigencia_dias">Vigencia</label>
          <input
            defaultValue={empresa.vigencia_dias}
            id="vigencia_dias"
            max={VIGENCIA_DIAS_MAXIMA}
            min={VIGENCIA_DIAS_MINIMA}
            name="vigencia_dias"
            required
            step={1}
            type="number"
          />
          <span className="pista">
            Días que vale una cotización aprobada, de {VIGENCIA_DIAS_MINIMA} a{' '}
            {VIGENCIA_DIAS_MAXIMA}.
          </span>
        </div>
      </div>

      <div className="acciones">
        <button disabled={enviando} type="submit">
          {enviando ? 'Guardando…' : 'Guardar datos de la empresa'}
        </button>
      </div>
    </form>
  )
}

function Aviso({ resultado }: { resultado: ResultadoDeGuardado | null }) {
  if (!resultado) {
    return null
  }

  return (
    <p
      className={`aviso ${resultado.ok ? 'aviso--exito' : 'aviso--error'}`}
      role={resultado.ok ? 'status' : 'alert'}
    >
      {resultado.mensaje}
    </p>
  )
}
