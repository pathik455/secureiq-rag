// Sanitize NEXTAUTH_URL and AUTH_URL if set to invalid placeholders
function getValidUrl(urlStr) {
  if (!urlStr || urlStr.includes('<') || urlStr.includes('>')) return null
  try {
    new URL(urlStr)
    return urlStr
  } catch {
    return null
  }
}

const rawAuthUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL
if (!getValidUrl(rawAuthUrl)) {
  if (process.env.VERCEL_URL) {
    process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`
    process.env.AUTH_URL = `https://${process.env.VERCEL_URL}`
  } else {
    process.env.NEXTAUTH_URL = 'http://localhost:3000'
    process.env.AUTH_URL = 'http://localhost:3000'
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
}

module.exports = nextConfig
