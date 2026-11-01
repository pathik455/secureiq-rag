import NextAuth from 'next-auth'
import { authEdgeConfig } from '@/lib/auth/edge'

export default NextAuth(authEdgeConfig).auth

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/schedule/tick).*)'],
}
