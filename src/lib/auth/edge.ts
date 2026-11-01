import type { NextAuthConfig } from 'next-auth'

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
