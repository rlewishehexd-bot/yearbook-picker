/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'firebasestorage.googleapis.com', // Firebase Storage domain
      // add any other domains that your images are hosted on
    ],
  },
};

module.exports = nextConfig;
