'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowLeft,
  Bug,
  Link as LinkIcon,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Shield,
  Layers,
  Calendar,
} from 'lucide-react'
import { formatDate, getSeverityBadgeClass, getStatusBadgeClass } from '@/lib/utils'
import Link from 'next/link'

interface PageProps {
  params: { id: string }
}

export default function VulnerabilityDetailPage({ params }: PageProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['vulnerability', params.id],
    queryFn: async () => {
      const res = await fetch(`/api/vulnerabilities/${params.id}`)
      if (!res.ok) throw new Error('Not found')
      return res.json()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (update: any) => {
      const res = await fetch(`/api/vulnerabilities/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vulnerability', params.id] })
      queryClient.invalidateQueries({ queryKey: ['vulnerabilities'] })
    },
  })

  const vuln = data?.data

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-8 w-48 bg-surface-2" />
        <Skeleton className="h-40 w-full bg-surface-2" />
        <Skeleton className="h-60 w-full bg-surface-2" />
      </div>
    )
  }

  if (!vuln) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Bug className="w-10 h-10 text-text-muted/40" />
        <p className="text-text-muted text-sm">Vulnerability record not found</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/vulnerabilities')}
          className="border-border text-text-secondary text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Vulnerabilities
        </Button>
      </div>
    )
  }

  const linkedRemediations = vuln.vulRemedLinks || []

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <button
          onClick={() => router.push('/vulnerabilities')}
          className="hover:text-text-primary transition-colors flex items-center gap-1 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Vulnerabilities Table
        </button>
        <ChevronRight className="w-3 h-3 text-text-muted/60" />
        <span className="text-text-secondary font-mono">
          {vuln.cveId || vuln.id.slice(0, 12)}
        </span>
      </div>

      {/* Hero Header Card */}
      <div className="p-6 rounded-xl bg-surface border border-border space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${getSeverityBadgeClass(
                  vuln.severity
                )}`}
              >
                {vuln.severity}
              </span>
              <span
                className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${getStatusBadgeClass(
                  vuln.status
                )}`}
              >
                {vuln.status.replace('_', ' ')}
              </span>
              {vuln.cveId && (
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-surface-2 border border-border text-text-muted font-bold">
                  {vuln.cveId}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-text-primary tracking-tight">
              {vuln.title}
            </h1>
          </div>

          <div className="p-3 rounded-lg bg-surface-2 border border-border text-right min-w-[110px] shrink-0">
            <div className="text-2xl font-bold font-mono text-accent">
              {vuln.cvssScore ? Number(vuln.cvssScore).toFixed(1) : '—'}
            </div>
            <div className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">
              CVSS Metric
            </div>
          </div>
        </div>

        {vuln.description && (
          <div className="p-4 rounded-lg bg-surface-2 border border-border space-y-1.5">
            <h3 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
              Technical Advisory & Scope
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              {vuln.description}
            </p>
          </div>
        )}

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-border">
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1 font-semibold">
              Affected System
            </p>
            <p className="text-xs text-text-primary font-medium">{vuln.affectedSystem || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1 font-semibold">
              Discovered
            </p>
            <p className="text-xs text-text-primary font-mono">
              {formatDate(vuln.discoveredAt || vuln.createdAt)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1 font-semibold">
              Last Updated
            </p>
            <p className="text-xs text-text-primary font-mono">{formatDate(vuln.updatedAt)}</p>
          </div>
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1 font-semibold">
              Remediations
            </p>
            <p className="text-xs text-accent font-bold font-mono">
              {linkedRemediations.length} Linked
            </p>
          </div>
        </div>

        {/* Tags */}
        {vuln.tags && vuln.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {vuln.tags.map((tag: string) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded bg-surface-2 border border-border text-text-muted font-mono"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Status Transition Control */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border">
          <span className="text-xs text-text-muted mr-1">Status State:</span>
          {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'FALSE_POSITIVE', 'DEFERRED'].map((st) => (
            <button
              key={st}
              onClick={() => updateMutation.mutate({ status: st })}
              className={`text-[10px] px-2.5 py-1 rounded-md font-medium transition-all ${
                vuln.status === st
                  ? 'bg-accent/20 text-accent border border-accent/40 font-bold'
                  : 'border border-border text-text-muted hover:border-border-light hover:text-text-secondary'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Linked Remediation Tasks (Core USP) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-accent" /> Linked Remediation Tasks (
            {linkedRemediations.length})
          </h2>
          <Link
            href="/remediations"
            className="text-xs text-accent hover:underline flex items-center gap-1 font-medium"
          >
            All Remediation Tasks <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {linkedRemediations.length === 0 ? (
          <div className="p-8 rounded-lg bg-surface border border-dashed border-border text-center space-y-2">
            <LinkIcon className="w-8 h-8 mx-auto text-text-muted/40" />
            <p className="text-xs text-text-muted">No remediations currently attached.</p>
            <p className="text-[11px] text-text-muted/60">
              Run the RAG AI agent or GitHub scanner to forge automated remediation bridges.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {linkedRemediations.map((link: any) => {
              const remed = link.remediation
              const targetId = link.remediationId || remed?.id
              return (
                <div
                  key={link.id}
                  onClick={() => targetId && router.push(`/remediations/${targetId}`)}
                  className="p-4 rounded-lg bg-surface border border-border hover:border-accent/40 cursor-pointer transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-text-primary group-hover:text-accent transition-colors">
                          {remed?.title || 'Remediation Task'}
                        </span>
                        {link.linkType === 'AI_GENERATED' && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/15 text-accent border border-accent/30 font-bold">
                            AI {(Number(link.confidenceScore || 0.95) * 100).toFixed(0)}% match
                          </span>
                        )}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full ${getStatusBadgeClass(
                            remed?.status || 'PENDING'
                          )}`}
                        >
                          {(remed?.status || 'PENDING').replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                        {remed?.description || 'No description provided'}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-text-muted pt-1">
                        <span>Agent: {link.createdByAgent || 'Security Agent'}</span>
                        {link.notes && <span>• {link.notes}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-text-muted group-hover:text-accent transition-colors shrink-0">
                      <span className="text-[11px] font-medium hidden sm:inline">View Remediation</span>
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
