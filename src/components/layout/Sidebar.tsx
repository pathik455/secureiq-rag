'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  ShieldAlert,
  Bug,
  Wrench,
  Cpu,
  Database,
  Calendar,
  Sparkles,
  GitBranch,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store'

const navItems = [
  { href: '/vulnerabilities', label: 'Vulnerabilities', icon: Bug, badge: null },
  { href: '/remediations', label: 'Remediations', icon: Wrench, badge: null },
  { href: '/scanner', label: 'Repo Scanner', icon: GitBranch, badge: 'New' },
  { href: '/skills', label: 'Skills & Agents', icon: Cpu, badge: '2 Active' },
  { href: '/cache', label: 'Pattern Cache', icon: Database, badge: null },
  { href: '/schedule', label: 'Scheduler', icon: Calendar, badge: null },
  { href: '/profile', label: 'Profile', icon: User, badge: null },
]

export function Sidebar() {
  const pathname = usePathname()
  const { setIsAgentModalOpen } = useAppStore()

  return (
    <aside className="w-64 bg-surface border-r border-border flex flex-col justify-between select-none">
      <div>
        {/* Brand Header with edocode logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-border bg-black/40">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-accent/40 bg-black flex items-center justify-center shadow-glow-green-sm">
            <Image
              src="/edocode-logo.png"
              alt="edocode455 logo"
              width={32}
              height={32}
              className="object-cover"
              onError={(e) => {
                // fallback if image fails
                const target = e.currentTarget
                target.style.display = 'none'
              }}
            />
            <ShieldAlert className="w-4 h-4 text-accent absolute" style={{ opacity: 0 }} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-white">
                SecureIQ
              </span>
              <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-accent/20 text-accent border border-accent/30 font-mono">
                edocode
              </span>
            </div>
            <p className="text-[10px] text-text-muted">Autonomous RAG Platform</p>
          </div>
        </div>

        {/* Quick Action Button - Neon Green */}
        <div className="p-4 border-b border-border/40">
          <Button
            onClick={() => setIsAgentModalOpen(true)}
            className="w-full justify-center gap-2 bg-accent hover:bg-accent-hover text-black font-bold shadow-glow-green-sm text-xs h-9 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            Run RAG Pipeline
          </Button>
        </div>

        {/* Navigation items */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            Intelligence Hub
          </div>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all group',
                  isActive
                    ? 'bg-surface-3 text-white border border-accent/40 shadow-sm shadow-accent/10 font-semibold'
                    : 'text-text-secondary hover:text-white hover:bg-surface-2'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={cn(
                      'w-4 h-4 transition-colors',
                      isActive ? 'text-accent' : 'text-text-muted group-hover:text-text-secondary'
                    )}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded font-mono',
                    isActive
                      ? 'bg-accent/20 border border-accent/40 text-accent font-bold'
                      : 'bg-surface-2 border border-border text-text-muted'
                  )}>
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Footer System Status */}
      <div className="p-4 border-t border-border bg-black/60">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            <span className="text-text-secondary text-[11px] font-medium">edocode Engine</span>
          </div>
          <span className="text-[10px] font-mono text-accent font-semibold">Active</span>
        </div>
        <div className="mt-2 text-[10px] text-text-muted flex items-center justify-between font-mono">
          <span>v1.2.0</span>
          <span>Next.js 14 • RAG</span>
        </div>
      </div>
    </aside>
  )
}
