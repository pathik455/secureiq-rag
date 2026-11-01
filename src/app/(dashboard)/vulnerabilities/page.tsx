'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Bug,
  Plus,
  Search,
  Sparkles,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ExternalLink,
  Trash2,
  ChevronLeft,
  ChevronRight,
  GitBranch,
} from 'lucide-react'
import { useVulnerabilities } from '@/hooks/useVulnerabilities'
import { formatDate, getSeverityBadgeClass, getStatusBadgeClass } from '@/lib/utils'
import { SecurityOverview } from '@/components/charts/SecurityOverview'
import { useAppStore } from '@/store'
import Link from 'next/link'

type SortField = 'severity' | 'cvssScore' | 'status' | 'createdAt' | 'title'
type SortDir = 'asc' | 'desc'

const PAGE_SIZE_OPTIONS = [10, 20, 50]

export default function VulnerabilitiesPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [showCharts, setShowCharts] = useState(false)
  const { setIsAgentModalOpen } = useAppStore()

  // Form state
  const [newTitle, setNewTitle] = useState('')
  const [newCve, setNewCve] = useState('')
  const [newSeverity, setNewSeverity] = useState('HIGH')
  const [newCvss, setNewCvss] = useState('7.5')
  const [newSystem, setNewSystem] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newTags, setNewTags] = useState('web, security')

  const { data, isLoading, createVulnerability, deleteVulnerability, isCreating } = useVulnerabilities({
    search,
    severity: severityFilter,
    status: statusFilter,
    page,
    limit,
    sort: sortField,
    sortDir,
  })

  const vulnerabilities = data?.data || []
  const meta = data?.meta
  const totalCount = meta?.total ?? vulnerabilities.length
  const totalPages = Math.ceil(totalCount / limit) || 1

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('desc')
    }
    setPage(1)
  }, [sortField])

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronsUpDown className="w-3 h-3 text-text-muted ml-1 inline" />
    return sortDir === 'asc' ? (
      <ChevronUp className="w-3 h-3 text-accent ml-1 inline" />
    ) : (
      <ChevronDown className="w-3 h-3 text-accent ml-1 inline" />
    )
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    await createVulnerability({
      title: newTitle,
      cveId: newCve.trim() || undefined,
      severity: newSeverity as any,
      cvssScore: parseFloat(newCvss) || 5.0,
      affectedSystem: newSystem || 'General',
      description: newDesc,
      tags: newTags.split(',').map((t) => t.trim()).filter(Boolean),
      status: 'OPEN',
    })

    setIsAddOpen(false)
    setNewTitle('')
    setNewCve('')
    setNewDesc('')
    setNewSystem('')
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Delete this vulnerability record?')) {
      await deleteVulnerability(id)
    }
  }

  const criticalCount = vulnerabilities.filter((v) => v.severity === 'CRITICAL').length
  const openCount = vulnerabilities.filter((v) => v.status === 'OPEN').length

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-text-primary">
              Vulnerabilities
            </h1>
            <Badge variant="outline" className="border-border text-text-muted text-[10px] font-mono">
              {totalCount} Total
            </Badge>
          </div>
          <p className="text-xs text-text-secondary">
            Manage detected security threats, CVSS ratings, and AI-linked remediation items
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/scanner">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 gap-1.5 border-accent/40 text-accent hover:bg-accent/10"
            >
              <GitBranch className="w-3.5 h-3.5" /> Scan GitHub Repo
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCharts(!showCharts)}
            className="text-xs h-8 border-border text-text-secondary hover:text-text-primary"
          >
            {showCharts ? 'Hide Visuals' : 'Show Visuals'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAgentModalOpen(true)}
            className="text-xs h-8 gap-1.5 border-accent/40 text-accent hover:bg-accent/10"
          >
            <Sparkles className="w-3.5 h-3.5" /> Run AI Agent
          </Button>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="text-xs h-8 gap-1.5 bg-accent hover:bg-accent-hover text-black font-bold shadow-glow-green-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Add Vulnerability
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-surface border-border max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-text-primary">Add Security Vulnerability</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-xs text-text-secondary">Title *</Label>
                    <Input
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Remote Code Execution in Log Handler"
                      className="bg-surface-2 border-border text-text-primary text-sm h-9"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-text-secondary">CVE ID</Label>
                    <Input
                      value={newCve}
                      onChange={(e) => setNewCve(e.target.value)}
                      placeholder="CVE-2024-XXXX"
                      className="bg-surface-2 border-border text-text-primary text-sm h-9 font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-text-secondary">Severity</Label>
                    <select
                      value={newSeverity}
                      onChange={(e) => setNewSeverity(e.target.value)}
                      className="w-full h-9 px-2 text-sm rounded-md bg-surface-2 border border-border text-text-primary"
                    >
                      {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-text-secondary">CVSS Score (0-10)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={newCvss}
                      onChange={(e) => setNewCvss(e.target.value)}
                      className="bg-surface-2 border-border text-text-primary text-sm h-9 font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-text-secondary">Affected System</Label>
                    <Input
                      value={newSystem}
                      onChange={(e) => setNewSystem(e.target.value)}
                      placeholder="e.g. auth-gateway"
                      className="bg-surface-2 border-border text-text-primary text-sm h-9"
                    />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-xs text-text-secondary">Tags (comma separated)</Label>
                    <Input
                      value={newTags}
                      onChange={(e) => setNewTags(e.target.value)}
                      placeholder="web, rce, zero-day"
                      className="bg-surface-2 border-border text-text-primary text-sm h-9"
                    />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-xs text-text-secondary">Technical Description</Label>
                    <Textarea
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="Advisory details, exploit vectors, affected versions..."
                      className="bg-surface-2 border-border text-text-primary text-sm resize-none"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddOpen(false)}
                    className="border-border text-text-secondary text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isCreating}
                    className="bg-accent hover:bg-accent-hover text-black font-bold text-xs"
                  >
                    {isCreating ? 'Adding...' : 'Add Vulnerability'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Tracked', value: totalCount, color: 'text-text-primary' },
          { label: 'Critical Severity', value: criticalCount, color: 'text-red-400' },
          { label: 'Open Status', value: openCount, color: 'text-orange-400' },
          {
            label: 'Resolved / Patched',
            value: vulnerabilities.filter((v) => v.status === 'RESOLVED').length,
            color: 'text-accent',
          },
        ].map((stat) => (
          <div key={stat.label} className="p-3.5 rounded-lg bg-surface border border-border">
            <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">
              {stat.label}
            </p>
            <p className={`text-xl font-bold mt-0.5 font-mono ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {showCharts && <SecurityOverview vulnerabilities={vulnerabilities} />}

      {/* Filter and Page Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-surface border border-border">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Filter by CVE, title, or system..."
              className="pl-8 h-8 text-xs bg-surface-2 border-border text-text-primary"
            />
          </div>

          <select
            value={severityFilter}
            onChange={(e) => {
              setSeverityFilter(e.target.value)
              setPage(1)
            }}
            className="h-8 px-2 text-xs rounded-md bg-surface-2 border border-border text-text-secondary"
          >
            <option value="ALL">All Severities</option>
            {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="h-8 px-2 text-xs rounded-md bg-surface-2 border border-border text-text-secondary"
          >
            <option value="ALL">All Statuses</option>
            {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'FALSE_POSITIVE', 'DEFERRED'].map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Page Size Switcher (10-20-50 max per page) */}
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <span className="text-[10px] uppercase font-semibold">Rows:</span>
          {PAGE_SIZE_OPTIONS.map((size) => (
            <button
              key={size}
              onClick={() => {
                setLimit(size)
                setPage(1)
              }}
              className={`px-2.5 py-1 text-[11px] rounded font-mono font-medium transition-all ${
                limit === size
                  ? 'bg-accent/20 text-accent border border-accent/40 font-bold'
                  : 'bg-surface-2 border border-border text-text-muted hover:text-text-primary'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Vulnerabilities Table with Viewable Row Navigation */}
      <div className="rounded-lg border border-border overflow-hidden bg-surface">
        <div className="overflow-x-auto">
          <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow className="border-border bg-surface-2">
              <TableHead
                className="text-[10px] text-text-muted uppercase tracking-wider cursor-pointer hover:text-text-primary select-none"
                onClick={() => handleSort('title')}
              >
                Title <SortIcon field="title" />
              </TableHead>
              <TableHead
                className="text-[10px] text-text-muted uppercase tracking-wider cursor-pointer hover:text-text-primary select-none"
                onClick={() => handleSort('severity')}
              >
                Severity <SortIcon field="severity" />
              </TableHead>
              <TableHead
                className="text-[10px] text-text-muted uppercase tracking-wider cursor-pointer hover:text-text-primary select-none hidden sm:table-cell"
                onClick={() => handleSort('cvssScore')}
              >
                CVSS <SortIcon field="cvssScore" />
              </TableHead>
              <TableHead
                className="text-[10px] text-text-muted uppercase tracking-wider cursor-pointer hover:text-text-primary select-none"
                onClick={() => handleSort('status')}
              >
                Status <SortIcon field="status" />
              </TableHead>
              <TableHead className="text-[10px] text-text-muted uppercase tracking-wider hidden md:table-cell">
                System
              </TableHead>
              <TableHead className="text-[10px] text-text-muted uppercase tracking-wider hidden lg:table-cell">
                Remediations
              </TableHead>
              <TableHead
                className="text-[10px] text-text-muted uppercase tracking-wider cursor-pointer hover:text-text-primary select-none hidden lg:table-cell"
                onClick={() => handleSort('createdAt')}
              >
                Discovered <SortIcon field="createdAt" />
              </TableHead>
              <TableHead className="w-16 text-[10px] text-text-muted uppercase tracking-wider">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full bg-surface-2" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : vulnerabilities.length === 0 ? (
              <TableRow className="border-border">
                <TableCell colSpan={8} className="text-center py-12 text-text-muted text-sm">
                  <Bug className="w-8 h-8 mx-auto mb-2 text-text-muted/40" />
                  No vulnerabilities matched your criteria.
                </TableCell>
              </TableRow>
            ) : (
              vulnerabilities.map((vuln) => {
                const linkedCount = (vuln.vulRemedLinks || []).length
                return (
                  <TableRow
                    key={vuln.id}
                    className="border-border cursor-pointer hover:bg-surface-2 transition-colors group"
                    onClick={() => router.push(`/vulnerabilities/${vuln.id}`)}
                  >
                    <TableCell className="py-3">
                      <div className="space-y-0.5 max-w-md">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-text-primary group-hover:text-accent transition-colors line-clamp-1">
                            {vuln.title}
                          </p>
                          <ExternalLink className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </div>
                        {vuln.cveId && (
                          <p className="text-[10px] font-mono text-text-muted">{vuln.cveId}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getSeverityBadgeClass(
                          vuln.severity
                        )}`}
                      >
                        {vuln.severity}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-xs font-mono font-medium text-text-secondary">
                        {vuln.cvssScore ? Number(vuln.cvssScore).toFixed(1) : '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusBadgeClass(
                          vuln.status
                        )}`}
                      >
                        {vuln.status.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-text-secondary">
                      {vuln.affectedSystem || '—'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {linkedCount > 0 ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/15 text-accent border border-accent/30 font-bold">
                          {linkedCount} linked
                        </span>
                      ) : (
                        <span className="text-[10px] text-text-muted font-mono">0</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-text-muted font-mono">
                      {formatDate(vuln.discoveredAt || vuln.createdAt)}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleDelete(vuln.id, e)}
                        className="p-1.5 rounded hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-all"
                        title="Delete vulnerability"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
        </div>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-[11px] text-text-muted font-mono">
            Showing {Math.min((page - 1) * limit + 1, totalCount)}–
            {Math.min(page * limit, totalCount)} of {totalCount} records
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-7 w-7 p-0 border-border text-text-secondary disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 7) pageNum = i + 1
              else if (page <= 4) pageNum = i + 1
              else if (page >= totalPages - 3) pageNum = totalPages - 6 + i
              else pageNum = page - 3 + i
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`h-7 w-7 text-[10px] rounded font-mono font-medium transition-all ${
                    page === pageNum
                      ? 'bg-accent/20 text-accent border border-accent/40 font-bold'
                      : 'border border-border text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-7 w-7 p-0 border-border text-text-secondary disabled:opacity-40"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
