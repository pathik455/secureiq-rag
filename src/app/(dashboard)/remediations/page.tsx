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
  Wrench,
  Plus,
  Search,
  Sparkles,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react'
import { useRemediations } from '@/hooks/useRemediations'
import { useVulnerabilities } from '@/hooks/useVulnerabilities'
import { formatDate, getStatusBadgeClass } from '@/lib/utils'

type SortField = 'title' | 'status' | 'priority' | 'dueDate' | 'createdAt'
type SortDir = 'asc' | 'desc'

const PAGE_SIZE_OPTIONS = [10, 20, 50]

export default function RemediationsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [isAddOpen, setIsAddOpen] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('HIGH')
  const [vulnerabilityId, setVulnerabilityId] = useState('')

  const { data, isLoading, createRemediation, deleteRemediation, isCreating } = useRemediations({
    search,
    status: statusFilter,
    priority: priorityFilter,
    page,
    limit,
    sort: sortField,
    sortDir,
  })

  const { data: vulnsData } = useVulnerabilities({ limit: 100 })
  const vulnerabilities = vulnsData?.data || []

  const remediations = data?.data || []
  const meta = data?.meta
  const totalCount = meta?.total ?? remediations.length
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
    if (!title.trim()) return

    await createRemediation({
      title,
      description,
      priority: priority as any,
      status: 'PENDING',
      vulnerabilityId: vulnerabilityId || undefined,
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    })

    setIsAddOpen(false)
    setTitle('')
    setDescription('')
    setVulnerabilityId('')
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Delete this remediation task?')) {
      await deleteRemediation(id)
    }
  }

  const priorityColors: Record<string, string> = {
    CRITICAL: 'text-red-400 bg-red-500/10 border-red-500/30',
    HIGH: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    MEDIUM: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    LOW: 'text-accent bg-accent/10 border-accent/30',
  }

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-text-primary">
              Remediation Tasks
            </h1>
            <Badge variant="outline" className="border-border text-text-muted text-[10px] font-mono">
              {totalCount} Total
            </Badge>
          </div>
          <p className="text-xs text-text-secondary">
            Actionable mitigation tasks, patches, and AI-forged security remediation plans
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="text-xs h-8 gap-1.5 bg-accent hover:bg-accent-hover text-black font-bold shadow-glow-green-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Create Remediation
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-surface border-border max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-text-primary">Create Remediation Task</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-text-secondary">Task Title *</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Upgrade log4j dependency to 2.17.1"
                    className="bg-surface-2 border-border text-text-primary text-sm h-9"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-text-secondary">Priority</Label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full h-9 px-2 text-sm rounded-md bg-surface-2 border border-border text-text-primary"
                    >
                      {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-text-secondary">Link Vulnerability</Label>
                    <select
                      value={vulnerabilityId}
                      onChange={(e) => setVulnerabilityId(e.target.value)}
                      className="w-full h-9 px-2 text-sm rounded-md bg-surface-2 border border-border text-text-primary"
                    >
                      <option value="">None / Standalone</option>
                      {vulnerabilities.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.cveId ? `${v.cveId} - ` : ''}
                          {v.title.slice(0, 30)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-text-secondary">Remediation Steps & Plan</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Step-by-step instructions for implementing this fix..."
                    className="bg-surface-2 border-border text-text-primary text-sm resize-none"
                    rows={4}
                  />
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
                    {isCreating ? 'Creating...' : 'Create Task'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Toolbar: Filters and Rows */}
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
              placeholder="Search remediation title or notes..."
              className="pl-8 h-8 text-xs bg-surface-2 border-border text-text-primary"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="h-8 px-2 text-xs rounded-md bg-surface-2 border border-border text-text-secondary"
          >
            <option value="ALL">All Statuses</option>
            {['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DEFERRED'].map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value)
              setPage(1)
            }}
            className="h-8 px-2 text-xs rounded-md bg-surface-2 border border-border text-text-secondary"
          >
            <option value="ALL">All Priorities</option>
            {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Page size options (10-20-50) */}
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

      {/* Remediations Table with Viewable Row Navigation */}
      <div className="rounded-lg border border-border overflow-hidden bg-surface">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-surface-2">
              <TableHead
                className="text-[10px] text-text-muted uppercase tracking-wider cursor-pointer hover:text-text-primary select-none"
                onClick={() => handleSort('title')}
              >
                Task Title <SortIcon field="title" />
              </TableHead>
              <TableHead
                className="text-[10px] text-text-muted uppercase tracking-wider cursor-pointer hover:text-text-primary select-none"
                onClick={() => handleSort('status')}
              >
                Status <SortIcon field="status" />
              </TableHead>
              <TableHead
                className="text-[10px] text-text-muted uppercase tracking-wider cursor-pointer hover:text-text-primary select-none"
                onClick={() => handleSort('priority')}
              >
                Priority <SortIcon field="priority" />
              </TableHead>
              <TableHead className="text-[10px] text-text-muted uppercase tracking-wider hidden md:table-cell">
                Linked Threat
              </TableHead>
              <TableHead className="text-[10px] text-text-muted uppercase tracking-wider hidden lg:table-cell">
                Source
              </TableHead>
              <TableHead
                className="text-[10px] text-text-muted uppercase tracking-wider cursor-pointer hover:text-text-primary select-none hidden lg:table-cell"
                onClick={() => handleSort('dueDate')}
              >
                Due Date <SortIcon field="dueDate" />
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
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full bg-surface-2" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : remediations.length === 0 ? (
              <TableRow className="border-border">
                <TableCell colSpan={7} className="text-center py-12 text-text-muted text-sm">
                  <Wrench className="w-8 h-8 mx-auto mb-2 text-text-muted/40" />
                  No remediation tasks found.
                </TableCell>
              </TableRow>
            ) : (
              remediations.map((remed) => {
                const firstLink = remed.vulRemedLinks?.[0]
                const linkedVuln = firstLink?.vulnerability

                return (
                  <TableRow
                    key={remed.id}
                    className="border-border cursor-pointer hover:bg-surface-2 transition-colors group"
                    onClick={() => router.push(`/remediations/${remed.id}`)}
                  >
                    <TableCell className="py-3">
                      <div className="space-y-0.5 max-w-md">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-text-primary group-hover:text-accent transition-colors line-clamp-1">
                            {remed.title}
                          </p>
                          <ExternalLink className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </div>
                        {remed.description && (
                          <p className="text-[11px] text-text-muted line-clamp-1">
                            {remed.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusBadgeClass(
                          remed.status
                        )}`}
                      >
                        {remed.status.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell>
                      {remed.priority ? (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            priorityColors[remed.priority] || 'text-text-muted border-border'
                          }`}
                        >
                          {remed.priority}
                        </span>
                      ) : (
                        <span className="text-xs text-text-muted">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-text-secondary">
                      {linkedVuln ? (
                        <span className="font-mono text-accent">
                          {linkedVuln.cveId || linkedVuln.title.slice(0, 20)}
                        </span>
                      ) : (
                        <span className="text-text-muted text-[11px]">Unlinked</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {remed.isAiGenerated ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/15 text-accent border border-accent/30 font-bold">
                          AI Generated
                        </span>
                      ) : (
                        <span className="text-[10px] text-text-muted font-mono">Manual</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-text-muted font-mono">
                      {remed.dueDate ? formatDate(remed.dueDate) : '—'}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleDelete(remed.id, e)}
                        className="p-1.5 rounded hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-all"
                        title="Delete task"
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

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-[11px] text-text-muted font-mono">
            Showing {Math.min((page - 1) * limit + 1, totalCount)}–
            {Math.min(page * limit, totalCount)} of {totalCount} tasks
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
