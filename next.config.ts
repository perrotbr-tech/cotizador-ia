import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Un error de tipos corta la construccion. Next 16 ya no corre ESLint
  // durante `next build`: el lint va por su propio comando, `npm run lint`.
  typescript: { ignoreBuildErrors: false },
}

export default nextConfig
