'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const PANTALLAS = [
  { href: '/cotizaciones', texto: 'Cotizaciones' },
  { href: '/productos', texto: 'Productos' },
  { href: '/configuracion', texto: 'Configuración' },
] as const

export function Navegacion() {
  const ruta = usePathname()

  return (
    <nav className="navegacion">
      {PANTALLAS.map((pantalla) => {
        const activa = ruta === pantalla.href || ruta.startsWith(`${pantalla.href}/`)
        return (
          <Link
            aria-current={activa ? 'page' : undefined}
            href={pantalla.href}
            key={pantalla.href}
          >
            {pantalla.texto}
          </Link>
        )
      })}
    </nav>
  )
}
