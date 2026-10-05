'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { crearClienteNavegador } from '@/lib/supabase/navegador'

export default function PaginaIngreso() {
  const enrutador = useRouter()
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function ingresar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setError(null)
    setEnviando(true)

    try {
      const supabase = crearClienteNavegador()
      const { error: errorDeIngreso } = await supabase.auth.signInWithPassword({
        email: correo.trim(),
        password: contrasena,
      })

      if (errorDeIngreso) {
        setError('No pudimos iniciar la sesion. Revisa el correo y la contrasena.')
        setEnviando(false)
        return
      }

      enrutador.replace('/cotizaciones')
      enrutador.refresh()
    } catch {
      setError('No pudimos conectarnos. Intenta de nuevo en un momento.')
      setEnviando(false)
    }
  }

  return (
    <main className="ingreso">
      <form className="ingreso__tarjeta" onSubmit={ingresar}>
        <h1>Cotizador IA</h1>
        <p className="subtitulo">Ingresa con tu correo y contraseña.</p>

        {error ? (
          <p className="aviso aviso--error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="campos">
          <div className="campo">
            <label htmlFor="correo">Correo</label>
            <input
              autoComplete="email"
              id="correo"
              name="correo"
              onChange={(evento) => setCorreo(evento.target.value)}
              required
              type="email"
              value={correo}
            />
          </div>

          <div className="campo">
            <label htmlFor="contrasena">Contraseña</label>
            <input
              autoComplete="current-password"
              id="contrasena"
              name="contrasena"
              onChange={(evento) => setContrasena(evento.target.value)}
              required
              type="password"
              value={contrasena}
            />
          </div>
        </div>

        <button disabled={enviando} type="submit">
          {enviando ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </main>
  )
}
