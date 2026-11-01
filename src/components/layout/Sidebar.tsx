'use client'

import React from 'react'
import Link from 'next/link'
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
  PanelLeftClose,
  PanelLeftOpen,
  X,
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
  const {
    setIsAgentModalOpen,
    isSidebarCollapsed,
    toggleSidebar,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
  } = useAppStore()

  // Navigation content renderer used for both desktop and mobile drawer
  const renderNavLinks = (isCollapsed = false, onNavigate?: () => void) => (
    <nav className={cn('space-y-1', isCollapsed ? 'p-2' : 'p-3')}>
      {!isCollapsed && (
        <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
          Intelligence Hub
        </div>
      )}
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))

        return (
          <div key={item.href} className="relative group">
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center rounded-md text-xs font-medium transition-all group/item',
                isCollapsed
                  ? 'justify-center w-10 h-10 mx-auto p-0'
                  : 'justify-between px-3 py-2',
                isActive
                  ? 'bg-surface-3 text-white border border-accent/40 shadow-sm shadow-accent/10 font-semibold'
                  : 'text-text-secondary hover:text-white hover:bg-surface-2'
              )}
            >
              <div className={cn('flex items-center', isCollapsed ? 'justify-center' : 'gap-2.5')}>
                <Icon
                  className={cn(
                    'w-4 h-4 transition-colors shrink-0',
                    isActive ? 'text-accent' : 'text-text-muted group-hover/item:text-text-secondary'
                  )}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </div>

              {!isCollapsed && item.badge && (
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0',
                    isActive
                      ? 'bg-accent/20 border border-accent/40 text-accent font-bold'
                      : 'bg-surface-2 border border-border text-text-muted'
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>

            {/* Hover Tooltip for Collapsed Sidebar (Icons over hover) */}
            {isCollapsed && (
              <div className="fixed left-[72px] ml-1 px-3 py-1.5 bg-surface-3 border border-border rounded-md shadow-2xl z-[60] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-2">
                <span className="text-xs font-semibold text-white whitespace-nowrap">
                  {item.label}
                </span>
                {item.badge && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-accent/20 border border-accent/40 text-accent font-mono font-bold whitespace-nowrap">
                    {item.badge}
                  </span>
                )}
                {/* Arrow */}
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-surface-3" />
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )

  return (
    <>
      {/* ============================================================== */}
      {/* 1. Mobile Backdrop Overlay                                      */}
      {/* ============================================================== */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ============================================================== */}
      {/* 2. Mobile Drawer (Slide in from left)                          */}
      {/* ============================================================== */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border flex flex-col justify-between select-none transform transition-transform duration-300 ease-in-out md:hidden shadow-2xl',
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div>
          {/* Mobile Drawer Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-border bg-black/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg border border-accent/40 bg-accent/10 flex items-center justify-center text-accent">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-sm tracking-tight text-white">SecureIQ</span>
                <p className="text-[10px] text-text-muted">Autonomous RAG</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="h-8 w-8 text-text-secondary hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Quick Action Button */}
          <div className="p-3 border-b border-border/40">
            <Button
              onClick={() => {
                setIsMobileSidebarOpen(false)
                setIsAgentModalOpen(true)
              }}
              className="w-full justify-center gap-2 bg-accent hover:bg-accent-hover text-black font-bold shadow-glow-green-sm text-xs h-9"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              Run RAG Pipeline
            </Button>
          </div>

          {/* Nav links */}
          {renderNavLinks(false, () => setIsMobileSidebarOpen(false))}
        </div>

        {/* Mobile Drawer Footer */}
        <div className="p-4 border-t border-border bg-black/60">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
              </span>
              <span className="text-text-secondary text-[11px] font-medium">RAG Engine</span>
            </div>
            <span className="text-[10px] font-mono text-accent font-semibold">Active</span>
          </div>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* 3. Desktop Collapsible Sidebar (Window Icon Toggle)            */}
      {/* ============================================================== */}
      <aside
        className={cn(
          'hidden md:flex flex-col justify-between select-none bg-surface border-r border-border transition-[width] duration-300 ease-in-out shrink-0 relative z-30',
          isSidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        <div>
          {/* Brand Header */}
          <div
            className={cn(
              'h-16 flex items-center border-b border-border bg-black/40',
              isSidebarCollapsed ? 'justify-center px-2' : 'justify-between px-4'
            )}
          >
            {isSidebarCollapsed ? (
              <div className="relative group/toggle flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  title="Expand sidebar"
                  className="w-10 h-10 rounded-lg text-accent hover:bg-surface-2 border border-accent/20"
                >
                  <PanelLeftOpen className="w-4 h-4" />
                </Button>
                {/* Hover Tooltip for Window Icon */}
                <div className="fixed left-[72px] ml-1 px-2.5 py-1 bg-surface-3 border border-border rounded-md shadow-xl z-[60] pointer-events-none opacity-0 group-hover/toggle:opacity-100 transition-opacity duration-150 whitespace-nowrap text-xs text-white">
                  Expand Sidebar
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-surface-3" />
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg border border-accent/40 bg-accent/10 flex items-center justify-center shadow-glow-green-sm text-accent shrink-0">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm tracking-tight text-white truncate">
                        SecureIQ
                      </span>
                    </div>
                    <p className="text-[10px] text-text-muted truncate">Autonomous RAG</p>
                  </div>
                </div>

                {/* Sidebar Window Icon (Close/Collapse option) */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  title="Collapse sidebar (Window Icon)"
                  className="h-8 w-8 text-text-muted hover:text-white hover:bg-surface-2 shrink-0 ml-1"
                >
                  <PanelLeftClose className="w-4 h-4 text-text-secondary hover:text-accent transition-colors" />
                </Button>
              </>
            )}
          </div>

          {/* Quick Action Button */}
          <div className={cn('border-b border-border/40', isSidebarCollapsed ? 'p-2 flex justify-center' : 'p-3')}>
            {isSidebarCollapsed ? (
              <div className="relative group/btn">
                <Button
                  size="icon"
                  onClick={() => setIsAgentModalOpen(true)}
                  className="w-10 h-10 rounded-lg bg-accent hover:bg-accent-hover text-black font-bold shadow-glow-green-sm"
                >
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </Button>
                {/* Tooltip on hover */}
                <div className="fixed left-[72px] ml-1 px-2.5 py-1 bg-surface-3 border border-border rounded-md shadow-xl z-[60] pointer-events-none opacity-0 group-hover/btn:opacity-100 transition-opacity duration-150 whitespace-nowrap text-xs text-white font-semibold">
                  Run RAG Pipeline
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-surface-3" />
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setIsAgentModalOpen(true)}
                className="w-full justify-center gap-2 bg-accent hover:bg-accent-hover text-black font-bold shadow-glow-green-sm text-xs h-9 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                Run RAG Pipeline
              </Button>
            )}
          </div>

          {/* Navigation Links with Hover Tooltips in collapsed mode */}
          {renderNavLinks(isSidebarCollapsed)}
        </div>

        {/* Footer System Status */}
        <div className={cn('border-t border-border bg-black/60', isSidebarCollapsed ? 'p-3 flex justify-center' : 'p-4')}>
          {isSidebarCollapsed ? (
            <div className="relative group/status flex items-center justify-center">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent"></span>
              </span>
              <div className="fixed left-[72px] ml-1 px-2.5 py-1 bg-surface-3 border border-border rounded-md shadow-xl z-[60] pointer-events-none opacity-0 group-hover/status:opacity-100 transition-opacity duration-150 whitespace-nowrap text-[11px] text-text-secondary">
                RAG Engine Active • v1.2.0
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-surface-3" />
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                  </span>
                  <span className="text-text-secondary text-[11px] font-medium">RAG Engine</span>
                </div>
                <span className="text-[10px] font-mono text-accent font-semibold">Active</span>
              </div>
              <div className="mt-2 text-[10px] text-text-muted flex items-center justify-between font-mono">
                <span>v1.2.0</span>
                <span>Next.js 14 • RAG</span>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  )
}