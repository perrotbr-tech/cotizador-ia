'use client'

import { useActionState } from 'react'

import { ESTADOS_DE_TIENDA, NOMBRE_DEL_ESTADO, type Tienda } from '@/lib/datos/tipos'

import { guardarTiendas, type ResultadoDeGuardado } from './acciones'

export function FormularioDeTiendas({ tiendas }: { tiendas: Tienda[] }) {
  const [resultado, enviar, enviando] = useActionState<ResultadoDeGuardado | null, FormData>(
    guardarTiendas,
    null,
  )

  return (
    <form action={enviar} className="tarjeta">
      <h2>Tiendas</h2>
      <p className="pista">
        Las preferidas salen primero en los candidatos. Las excluidas no se muestran nunca. El
        dato de IVA decide si el precio publicado se divide por 1,19 para llegar al costo neto.
      </p>

      {resultado ? (
        <p
          className={`aviso ${resultado.ok ? 'aviso--exito' : 'aviso--error'}`}
          role={resultado.ok ? 'status' : 'alert'}
        >
          {resultado.mensaje}
        </p>
      ) : null}

      {tiendas.length === 0 ? (
        <p className="pista">
          No hay tiendas cargadas. Aplica la migración 0001_base.sql en Supabase.
        </p>
      ) : (
        <table>
          <thead>
            <tr>
              <th scope="col">Tienda</th>
              <th scope="col">Alias en la búsqueda</th>
              <th scope="col">Estado</th>
              <th scope="col">Publica con IVA</th>
            </tr>
          </thead>
          <tbody>
            {tiendas.map((tienda) => (
              <tr key={tienda.id}>
                <td>
                  {tienda.nombre}
                  <input name="tienda_id" type="hidden" value={tienda.id} />
                </td>
                <td>
                  <code>{tienda.alias}</code>
                </td>
                <td>
                  <select
                    aria-label={`Estado de ${tienda.nombre}`}
                    defaultValue={tienda.estado}
                    name={`estado__${tienda.id}`}
                  >
                    {ESTADOS_DE_TIENDA.map((estado) => (
                      <option key={estado} value={estado}>
                        {NOMBRE_DEL_ESTADO[estado]}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    aria-label={`Publica con IVA en ${tienda.nombre}`}
                    defaultValue={tienda.publica_con_iva ? 'si' : 'no'}
                    name={`iva__${tienda.id}`}
                  >
                    <option value="si">Sí</option>
                    <option value="no">No</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tiendas.length > 0 ? (
        <div className="acciones">
          <button disabled={enviando} type="submit">
            {enviando ? 'Guardando…' : 'Guardar tiendas'}
          </button>
        </div>
      ) : null}
    </form>
  )
}
