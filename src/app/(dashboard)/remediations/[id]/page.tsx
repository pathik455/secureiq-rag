'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowLeft,
  Wrench,
  Link as LinkIcon,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  Calendar,
  CheckCircle2,
} from 'lucide-react'
import { formatDate, getSeverityBadgeClass, getStatusBadgeClass } from '@/lib/utils'
import Link from 'next/link'

interface PageProps {
  params: { id: string }
}

export default function RemediationDetailPage({ params }: PageProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['remediation', params.id],
    queryFn: async () => {
      const res = await fetch(`/api/remediations/${params.id}`)
      if (!res.ok) throw new Error('Not found')
      return res.json()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (update: any) => {
      const res = await fetch(`/api/remediations/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remediation', params.id] })
      queryClient.invalidateQueries({ queryKey: ['remediations'] })
    },
  })

  const remed = data?.data

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-8 w-48 bg-surface-2" />
        <Skeleton className="h-40 w-full bg-surface-2" />
        <Skeleton className="h-48 w-full bg-surface-2" />
      </div>
    )
  }

  if (!remed) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Wrench className="w-10 h-10 text-text-muted/40" />
        <p className="text-text-muted text-sm">Remediation task not found</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/remediations')}
          className="border-border text-text-secondary text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Remediations
        </Button>
      </div>
    )
  }

  const linkedVulns = remed.vulRemedLinks || []
  const priorityColors: Record<string, string> = {
    CRITICAL: 'text-red-400 bg-red-500/10 border-red-500/30',
    HIGH: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    MEDIUM: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    LOW: 'text-accent bg-accent/10 border-accent/30',
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <button
          onClick={() => router.push('/remediations')}
          className="hover:text-text-primary transition-colors flex items-center gap-1 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Remediations Table
        </button>
        <ChevronRight className="w-3 h-3 text-text-muted/60" />
        <span className="text-text-secondary font-mono">{remed.id.slice(0, 12)}</span>
      </div>

      {/* Main Remediation Card */}
      <div className="p-6 rounded-xl bg-surface border border-border space-y-5 shadow-sm">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${getStatusBadgeClass(
                remed.status
              )}`}
            >
              {remed.status.replace('_', ' ')}
            </span>
            {remed.priority && (
              <span
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${
                  priorityColors[remed.priority] || 'text-text-muted border-border'
                }`}
              >
                {remed.priority} Priority
              </span>
            )}
            {remed.isAiGenerated && (
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-accent/15 text-accent border border-accent/30 font-bold">
                AI Generated
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">{remed.title}</h1>
        </div>

        {remed.description && (
          <div className="p-4 rounded-lg bg-surface-2 border border-border space-y-1.5">
            <h3 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
              Remediation Action Plan
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">{remed.description}</p>
          </div>
        )}

        {remed.resolutionNotes && (
          <div className="p-4 rounded-lg bg-accent/5 border border-accent/20 space-y-1.5">
            <h3 className="text-[10px] font-semibold text-accent uppercase tracking-wider">
              Resolution & Validation Notes
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed font-mono">
              {remed.resolutionNotes}
            </p>
          </div>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-border">
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1 font-semibold">
              Due Date
            </p>
            <p className="text-xs text-text-primary font-mono">
              {remed.dueDate ? formatDate(remed.dueDate) : '—'}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1 font-semibold">
              Created
            </p>
            <p className="text-xs text-text-primary font-mono">{formatDate(remed.createdAt)}</p>
          </div>
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1 font-semibold">
              Last Updated
            </p>
            <p className="text-xs text-text-primary font-mono">{formatDate(remed.updatedAt)}</p>
          </div>
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1 font-semibold">
              Linked Threats
            </p>
            <p className="text-xs text-accent font-bold font-mono">{linkedVulns.length}</p>
          </div>
        </div>

        {/* Status transition controls */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border">
          <span className="text-xs text-text-muted mr-1">Update Status:</span>
          {['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DEFERRED'].map((st) => (
            <button
              key={st}
              onClick={() => updateMutation.mutate({ status: st })}
              className={`text-[10px] px-2.5 py-1 rounded-md font-medium transition-all ${
                remed.status === st
                  ? 'bg-accent/20 text-accent border border-accent/40 font-bold'
                  : 'border border-border text-text-muted hover:border-border-light hover:text-text-secondary'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Linked Vulnerabilities Section (Core USP) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-accent" /> Linked Security Vulnerabilities (
            {linkedVulns.length})
          </h2>
          <Link
            href="/vulnerabilities"
            className="text-xs text-accent hover:underline flex items-center gap-1 font-medium"
          >
            All Vulnerabilities <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {linkedVulns.length === 0 ? (
          <div className="p-8 rounded-lg bg-surface border border-dashed border-border text-center space-y-2">
            <ShieldAlert className="w-8 h-8 mx-auto text-text-muted/40" />
            <p className="text-xs text-text-muted">No vulnerabilities linked to this remediation task.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {linkedVulns.map((link: any) => {
              const vuln = link.vulnerability
              const targetId = link.vulnerabilityId || vuln?.id
              return (
                <div
                  key={link.id}
                  onClick={() => targetId && router.push(`/vulnerabilities/${targetId}`)}
                  className="p-4 rounded-lg bg-surface border border-border hover:border-accent/40 cursor-pointer transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-text-primary group-hover:text-accent transition-colors">
                          {vuln?.title || 'Security Vulnerability'}
                        </span>
                        {vuln?.cveId && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-2 border border-border text-text-muted font-bold">
                            {vuln.cveId}
                          </span>
                        )}
                        {vuln?.severity && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${getSeverityBadgeClass(
                              vuln.severity
                            )}`}
                          >
                            {vuln.severity}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                        {vuln?.description || 'No technical advisory'}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-text-muted pt-1">
                        <span>Affected Stack: {vuln?.affectedSystem || 'Core Stack'}</span>
                        {vuln?.cvssScore && (
                          <span className="font-mono text-accent font-semibold">
                            CVSS {Number(vuln.cvssScore).toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-text-muted group-hover:text-accent transition-colors shrink-0">
                      <span className="text-[11px] font-medium hidden sm:inline">View Threat</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
