import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/db/prisma'
import { authEdgeConfig } from './edge'

const googleClientId =
  process.env.GOOGLE_CLIENT_ID || 'placeholder-client-id.apps.googleusercontent.com'
const googleClientSecret =
  process.env.GOOGLE_CLIENT_SECRET || 'placeholder-client-secret'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authEdgeConfig,
  trustHost: true,
  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    'dev-secret-secureiq-rag-super-secret-key-32chars',
  providers: [
    // Official Google OAuth 2.0 Web Server Protocol (https://developers.google.com/identity/protocols/oauth2)
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      authorization: {
        url: 'https://accounts.google.com/o/oauth2/v2/auth',
        params: {
          prompt: 'select_account',
          access_type: 'offline',
          response_type: 'code',
          scope: 'openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
        },
      },
    }),
    Credentials({
      id: 'credentials',
      name: 'Security Analyst Demo',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'analyst@edocode.in' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string) || 'analyst@edocode.in'

        try {
          let user = await prisma.user.findUnique({
            where: { email },
          })

          if (!user) {
            user = await prisma.user.create({
              data: {
                email,
                name: 'Elena Rostova',
                username: 'elena_rostova',
                role: 'Security Analyst',
                department: 'Cybersecurity',
                githubUsername: 'edocode455',
                image:
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
              },
            })
          }

          return user
        } catch {
          return {
            id: 'demo-analyst-1',
            email,
            name: 'Elena Rostova',
            username: 'elena_rostova',
            role: 'Security Analyst',
            department: 'Cybersecurity',
            githubUsername: 'edocode455',
            image:
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
          }
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    ...authEdgeConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        try {
          const existing = await prisma.user.findUnique({ where: { email: user.email } })
          if (!existing) {
            await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || 'Security Analyst',
                image: user.image,
                role: 'Security Analyst',
                username: user.email.split('@')[0],
              },
            })
          }
        } catch (e) {
          console.warn('[auth] DB sync skipped during Google OAuth sign-in:', e)
        }
      }
      return true
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.sub) {
          session.user.id = token.sub
        }
        if (token.name) {
          session.user.name = token.name
        }
        if (token.email) {
          session.user.email = token.email
        }
        if (token.picture) {
          session.user.image = token.picture as string
        }
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
        token.name = user.name
        token.email = user.email
        token.picture = user.image
      }
      return token
    },
  },
})
