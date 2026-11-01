'use client'

import { signOut } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Bell,
  LogOut,
  Sparkles,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppStore } from '@/store'

interface HeaderProps {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  } | null
}

export function Header({ user }: HeaderProps) {
  const { setIsAgentModalOpen } = useAppStore()

  return (
    <header className="h-16 border-b border-border bg-surface/90 backdrop-blur-md px-6 flex items-center justify-between z-20">
      <div className="flex items-center gap-4">
        {/* Clean minimal breadcrumb space */}
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAgentModalOpen(true)}
          className="h-8 gap-1.5 border-accent/40 text-accent hover:bg-accent/15 text-xs font-semibold"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Trigger Agent
        </Button>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 h-8 px-2 rounded-full border border-border hover:bg-surface-2 hover:border-accent/30"
            >
              <div className="w-6 h-6 rounded-full overflow-hidden border border-accent/50 bg-surface-2 flex items-center justify-center">
                {user?.image ? (
                  <Image
                    src={user.image}
                    alt={user.name || 'User'}
                    width={24}
                    height={24}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <User className="w-3.5 h-3.5 text-accent" />
                )}
              </div>
              <span className="text-xs text-white font-medium max-w-[130px] truncate">
                {user?.name || 'Security Analyst'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-surface border-border">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-xs font-medium text-white">{user?.name || 'Security Analyst'}</p>
                <p className="text-[11px] text-text-muted truncate">{user?.email || 'Logged in'}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem asChild className="text-xs cursor-pointer text-text-secondary hover:text-white">
              <Link href="/profile" className="flex items-center w-full">
                <User className="w-3.5 h-3.5 mr-2 text-accent" />
                View Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-xs text-red-400 cursor-pointer hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut className="w-3.5 h-3.5 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
