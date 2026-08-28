/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Sandbox/preview Arena memakai host *.e2b.app. Tanpa izin origin, Next.js dev
  // menolak permintaan lintas origin.
  allowedDevOrigins: ["*.e2b.app", "localhost"],
};

export default nextConfig;
