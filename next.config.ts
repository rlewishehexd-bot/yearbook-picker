/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'firebasestorage.googleapis.com', // Firebase Storage domain
      'f004.backblazeb2.com', // Backblaze B2 domain
    ],
  },
};

module.exports = nextConfig;
