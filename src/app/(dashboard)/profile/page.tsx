'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  User,
  Mail,
  Building2,
  Phone,
  Github,
  Linkedin,
  Pencil,
  CheckCircle2,
  Shield,
  Calendar,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Image from 'next/image'

export default function ProfilePage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<any>({})

  const { data, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const res = await fetch('/api/user/profile')
      if (!res.ok) throw new Error('Failed to fetch profile')
      return res.json()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update profile')
      return res.json()
    },
    onSuccess: (res) => {
      queryClient.setQueryData(['user-profile'], res)
      setIsEditing(false)
    },
  })

  const profile = data?.data

  const displayProfile = profile || {
    name: session?.user?.name || 'Security Analyst',
    email: session?.user?.email || '',
    image: session?.user?.image,
    username: session?.user?.email ? session.user.email.split('@')[0] : 'analyst',
    bio: 'Security Analyst specializing in vulnerability intelligence and automated remediation.',
    role: 'Security Analyst',
    department: 'Cybersecurity',
    phone: '',
    githubUsername: '',
    linkedinUrl: '',
    createdAt: new Date().toISOString(),
  }

  const handleStartEdit = () => {
    setForm({
      name: displayProfile.name || '',
      username: displayProfile.username || '',
      bio: displayProfile.bio || '',
      role: displayProfile.role || '',
      department: displayProfile.department || '',
      phone: displayProfile.phone || '',
      githubUsername: displayProfile.githubUsername || '',
      linkedinUrl: displayProfile.linkedinUrl || '',
    })
    setIsEditing(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(form)
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-40 w-full bg-surface-2" />
        <Skeleton className="h-60 w-full bg-surface-2" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-text-primary">
          User Profile
        </h1>
        <p className="text-xs text-text-secondary">
          Manage your analyst identity, credentials, and organization profile
        </p>
      </div>

      {/* Profile Header Card */}
      <div className="p-6 rounded-xl bg-surface border border-border relative overflow-hidden">
        <div className="flex items-start gap-5">
          <div className="relative shrink-0">
            {displayProfile.image ? (
              <Image
                src={displayProfile.image}
                alt={displayProfile.name || 'User'}
                width={80}
                height={80}
                className="rounded-2xl border-2 border-accent/40 object-cover shadow-glow-green-sm"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl border-2 border-accent/40 bg-surface-2 flex items-center justify-center">
                <User className="w-8 h-8 text-accent" />
              </div>
            )}
            <div
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-accent border-2 border-black"
              title="Analyst Online"
            />
          </div>

          <div className="flex-1 space-y-1.5 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg font-bold text-text-primary truncate">
                {displayProfile.name}
              </h2>
              <Badge
                variant="outline"
                className="border-accent/40 text-accent text-[10px] font-mono"
              >
                {displayProfile.role || 'Security Analyst'}
              </Badge>
            </div>
            <p className="text-xs text-text-muted font-mono">{displayProfile.email}</p>
            {displayProfile.username && (
              <p className="text-xs text-accent/80 font-mono">@{displayProfile.username}</p>
            )}
            {displayProfile.bio && (
              <p className="text-xs text-text-secondary leading-relaxed pt-1">
                {displayProfile.bio}
              </p>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={isEditing ? () => setIsEditing(false) : handleStartEdit}
            className="border-border text-text-secondary hover:text-text-primary text-xs shrink-0"
          >
            <Pencil className="w-3.5 h-3.5 mr-1.5" />
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </Button>
        </div>
      </div>

      {/* Edit Form or Information Grid */}
      {isEditing ? (
        <form onSubmit={handleSubmit} className="p-6 rounded-xl bg-surface border border-border space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h3 className="text-sm font-semibold text-text-primary">Edit Analyst Details</h3>
            <span className="text-[10px] text-text-muted font-mono">Updates live in PostgreSQL</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-text-secondary">Full Name</Label>
              <Input
                value={form.name || ''}
                onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))}
                className="bg-surface-2 border-border text-text-primary text-sm h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-text-secondary">Username</Label>
              <Input
                value={form.username || ''}
                onChange={(e) => setForm((f: any) => ({ ...f, username: e.target.value }))}
                placeholder="elena_rostova"
                className="bg-surface-2 border-border text-text-primary text-sm h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-text-secondary">Role / Title</Label>
              <Input
                value={form.role || ''}
                onChange={(e) => setForm((f: any) => ({ ...f, role: e.target.value }))}
                placeholder="Security Analyst"
                className="bg-surface-2 border-border text-text-primary text-sm h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-text-secondary">Department</Label>
              <Input
                value={form.department || ''}
                onChange={(e) => setForm((f: any) => ({ ...f, department: e.target.value }))}
                placeholder="Cybersecurity & SOC"
                className="bg-surface-2 border-border text-text-primary text-sm h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-text-secondary">Phone</Label>
              <Input
                value={form.phone || ''}
                onChange={(e) => setForm((f: any) => ({ ...f, phone: e.target.value }))}
                placeholder="+1 (555) 000-0000"
                className="bg-surface-2 border-border text-text-primary text-sm h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-text-secondary">GitHub Username</Label>
              <Input
                value={form.githubUsername || ''}
                onChange={(e) => setForm((f: any) => ({ ...f, githubUsername: e.target.value }))}
                placeholder="github_username"
                className="bg-surface-2 border-border text-text-primary text-sm h-9 font-mono"
              />
            </div>
            <div className="col-span-1 sm:col-span-2 space-y-1.5">
              <Label className="text-xs text-text-secondary">LinkedIn Profile URL</Label>
              <Input
                value={form.linkedinUrl || ''}
                onChange={(e) => setForm((f: any) => ({ ...f, linkedinUrl: e.target.value }))}
                placeholder="https://linkedin.com/in/username"
                className="bg-surface-2 border-border text-text-primary text-sm h-9"
              />
            </div>
            <div className="col-span-1 sm:col-span-2 space-y-1.5">
              <Label className="text-xs text-text-secondary">Professional Bio</Label>
              <Textarea
                value={form.bio || ''}
                onChange={(e) => setForm((f: any) => ({ ...f, bio: e.target.value }))}
                placeholder="Write your security intelligence focus..."
                rows={3}
                className="bg-surface-2 border-border text-text-primary text-sm resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(false)}
              className="border-border text-text-secondary text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={updateMutation.isPending}
              className="bg-accent hover:bg-accent-hover text-black font-bold text-xs"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Identity Info */}
          <div className="p-5 rounded-xl bg-surface border border-border space-y-3.5">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-accent" />
              Identity & Access
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                <span className="text-text-muted flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-text-muted" /> Email
                </span>
                <span className="text-text-primary font-mono">{displayProfile.email}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                <span className="text-text-muted flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-text-muted" /> Username
                </span>
                <span className="text-text-primary font-mono">
                  {displayProfile.username ? `@${displayProfile.username}` : '—'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                <span className="text-text-muted flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-text-muted" /> Department
                </span>
                <span className="text-text-primary font-medium">
                  {displayProfile.department || 'Cybersecurity'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                <span className="text-text-muted flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-text-muted" /> Phone
                </span>
                <span className="text-text-primary font-mono">{displayProfile.phone || '—'}</span>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-text-muted flex items-center gap-2">
                  <Github className="w-3.5 h-3.5 text-text-muted" /> GitHub
                </span>
                {displayProfile.githubUsername ? (
                  <a
                    href={`https://github.com/${displayProfile.githubUsername}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent hover:underline font-mono flex items-center gap-1"
                  >
                    {displayProfile.githubUsername}
                  </a>
                ) : (
                  <span className="text-text-muted font-mono">—</span>
                )}
              </div>
            </div>
          </div>

          {/* Activity & System Status */}
          <div className="p-5 rounded-xl bg-surface border border-border space-y-3.5">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-accent" />
              Activity & Verification
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                <span className="text-text-muted">Account Registered</span>
                <span className="text-text-primary font-mono">
                  {formatDate(displayProfile.createdAt)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                <span className="text-text-muted">Authentication Mode</span>
                <span className="text-accent font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent" /> Verified Session
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                <span className="text-text-muted">Platform Role</span>
                <span className="text-text-primary font-medium">SecOps Administrator</span>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-text-muted">Workspace</span>
                <span className="text-accent font-mono font-bold">SecureIQ</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
