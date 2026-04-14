/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {
    // Force Turbopack to use this directory as the workspace root to avoid
    // picking up the wrong lockfile from the user's home directory.
    // `process.cwd()` will resolve to the repository root when running `next dev`.
    root: process.cwd(),
  },
}

export default nextConfig
