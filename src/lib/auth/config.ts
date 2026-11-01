import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/db/prisma'
import { supabaseAdmin } from '@/lib/db/supabase'
import { authEdgeConfig } from './edge'

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
          // If Prisma is unavailable, fallback to Supabase Admin or return session
          try {
            const { data } = await supabaseAdmin.from('User').select('*').eq('email', email).maybeSingle()
            if (data) return data
          } catch {}

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
        const userData = {
          email: user.email,
          name: user.name || 'Security Analyst',
          image: user.image || null,
          role: 'Analyst',
          username: user.email.split('@')[0],
          updatedAt: new Date().toISOString(),
        }

        let synced = false

        // 1. Attempt sync via Prisma (if DATABASE_URL is reachable)
        try {
          const existing = await prisma.user.findUnique({ where: { email: user.email } })
          if (!existing) {
            await prisma.user.create({
              data: {
                email: user.email,
                name: userData.name,
                image: userData.image,
                role: userData.role,
                username: userData.username,
              },
            })
          }
          synced = true
        } catch (prismaErr) {
          console.warn('[auth] Prisma user sync skipped, falling back to Supabase client:', (prismaErr as any)?.message)
        }

        // 2. Direct Supabase Admin sync (always works via HTTPS REST without database port/password)
        try {
          const userId = user.id || `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
          const { error } = await supabaseAdmin.from('User').upsert(
            {
              id: userId,
              ...userData,
            },
            { onConflict: 'email' }
          )
          if (error) {
            console.error('[auth] Supabase Admin sync error:', error)
          } else {
            console.log('[auth] Successfully synced Google user to Supabase:', user.email)
            synced = true
          }
        } catch (sbErr) {
          console.error('[auth] Supabase client exception:', sbErr)
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
      if (token.email) {
        try {
          const dbUser = await prisma.user.findUnique({ where: { email: token.email } })
          if (dbUser?.id) {
            token.sub = dbUser.id
          }
        } catch {
          try {
            const { data: sbUser } = await supabaseAdmin.from('User').select('id').eq('email', token.email).maybeSingle()
            if (sbUser?.id) {
              token.sub = sbUser.id
            }
          } catch {}
        }
      }
      return token
    },
  },
})
