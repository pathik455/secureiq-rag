'use client'

import React, { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import {
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  // Real Google OAuth 2.0 flow (https://developers.google.com/identity/protocols/oauth2)
  const handleGoogleSignIn = () => {
    setIsGoogleLoading(true)
    signIn('google', { callbackUrl: '/vulnerabilities' })
  }

  const handleDemoSignIn = () => {
    setIsLoading(true)
    signIn('credentials', {
      email: 'analyst@secureiq.io',
      password: 'demo-password',
      callbackUrl: '/vulnerabilities',
    })
  }

  const getErrorMessage = (err: string | null) => {
    switch (err) {
      case 'OAuthSignin':
      case 'OAuthCallback':
        return 'Could not establish connection with Google OAuth API. Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local.'
      case 'OAuthCreateAccount':
        return 'Could not create account via Google.'
      case 'OAuthAccountNotLinked':
        return 'This email is already associated with another login provider.'
      case 'Callback':
        return 'Authentication callback failed. Please retry.'
      case 'AccessDenied':
        return 'Access denied. You do not have permission to sign in.'
      case 'Configuration':
        return 'Google OAuth provider configuration error. Please ensure your Google Cloud credentials are valid.'
      default:
        return err ? `Authentication notice (${err}). Please try again or use the demo login.` : null
    }
  }

  const errorMessage = getErrorMessage(error)

  return (
    <div className="w-full max-w-md bg-surface border border-border p-8 relative z-10 space-y-6 rounded-xl shadow-2xl backdrop-blur-md">
      {/* Brand logo */}
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl border-2 border-accent/40 bg-accent/10 flex items-center justify-center shadow-glow-green-sm mb-1 text-accent">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-white">
            SecureIQ
          </h1>
        </div>
        <p className="text-xs text-text-secondary max-w-xs">
          Autonomous Vulnerability & Remediation Orchestration powered by Vector RAG
        </p>
      </div>

      {/* OAuth Error Alert Banner */}
      {errorMessage && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-400">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
          <div className="space-y-1">
            <p className="font-semibold text-red-300">Google OAuth Notice</p>
            <p className="text-[11px] text-red-300/80 leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Feature Highlights */}
      <div className="p-3.5 rounded-lg bg-surface-2 border border-border space-y-2">
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <CheckCircle className="w-3.5 h-3.5 text-accent shrink-0" />
          <span>Cybersecurity vector pattern intelligence engine</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <CheckCircle className="w-3.5 h-3.5 text-accent shrink-0" />
          <span>Semantic vector similarity via pgvector</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <CheckCircle className="w-3.5 h-3.5 text-accent shrink-0" />
          <span>Automated remediation link generation & GitHub auditing</span>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {/* Direct Google OAuth 2.0 Button */}
        <Button
          onClick={handleGoogleSignIn}
          disabled={isLoading || isGoogleLoading}
          variant="outline"
          className="w-full h-10 gap-3 border-border hover:bg-surface-3 hover:border-accent/40 text-white text-xs font-medium transition-all"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          {isGoogleLoading ? 'Connecting to Google OAuth...' : 'Continue with Google OAuth'}
        </Button>

        <div className="relative flex items-center justify-center">
          <span className="w-full border-t border-border" />
          <span className="bg-surface px-2 text-[10px] text-text-muted uppercase font-mono">or</span>
          <span className="w-full border-t border-border" />
        </div>

        <Button
          onClick={handleDemoSignIn}
          disabled={isLoading || isGoogleLoading}
          className="w-full h-10 gap-2 bg-accent hover:bg-accent-hover text-black font-bold text-xs shadow-glow-green-sm"
        >
          <ShieldCheck className="w-4 h-4" />
          {isLoading ? 'Authenticating...' : 'Sign In as Security Analyst (Demo)'}
          <ArrowRight className="w-3.5 h-3.5 ml-auto" />
        </Button>
      </div>

      <div className="text-center text-[11px] text-text-muted font-mono">
        SecureIQ • Cyber Security Intelligence Hub
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black relative overflow-hidden p-4">
      {/* Ambient background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-accent/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

      <Suspense fallback={<div className="text-white text-sm">Loading login portal...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
