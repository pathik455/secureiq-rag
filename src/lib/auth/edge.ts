import type { NextAuthConfig } from 'next-auth'

// Ensure NEXTAUTH_URL / AUTH_URL are valid URLs to prevent ERR_INVALID_URL
function sanitizeUrl() {
  const url = process.env.NEXTAUTH_URL || process.env.AUTH_URL
  if (url && (url.includes('<') || url.includes('>'))) {
    const fallback = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'
    process.env.NEXTAUTH_URL = fallback
    process.env.AUTH_URL = fallback
  }
}
sanitizeUrl()

export const authEdgeConfig: NextAuthConfig = {
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const { pathname } = nextUrl

      const isAuthPage = pathname.startsWith('/login')
      const isApi = pathname.startsWith('/api')
      const isCronTick = pathname.startsWith('/api/schedule/tick')

      if (isApi || isCronTick) {
        return true
      }

      if (isAuthPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL('/vulnerabilities', nextUrl))
        }
        return true
      }

      if (!isLoggedIn) {
        return false // Redirects to signIn page (/login)
      }

      return true
    },
  },
  providers: [],
}
