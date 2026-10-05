import type { Metadata } from 'next'

import './globals.css'

export const metadata: Metadata = {
  title: 'Cotizador IA',
  description: 'Cotizaciones a partir de la solicitud de un cliente final.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CL">
      <body>{children}</body>
    </html>
  )
}
