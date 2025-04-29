/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '**'
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
        port: '',
        pathname: '**'
      }
    ]
  }
}

// Validate required environment variables
const requiredEnvVars = ['PERPLEXITY_API_KEY'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: Environment variable ${envVar} is not set`);
    process.exit(1);
  }
}

module.exports = nextConfig
