/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pratinjau sandbox Arena memakai host *.e2b.app. Tanpa izin origin, Next.js
  // menolak permintaan lintas origin untuk aset /_next/* saat development.
  allowedDevOrigins: ['*.e2b.app', 'localhost'],
};

module.exports = nextConfig;
