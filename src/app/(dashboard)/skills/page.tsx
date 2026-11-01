'use client'

import React, { useState } from 'react'
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
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Cpu,
  Plus,
  Sparkles,
  Play,
  Database,
  Link as LinkIcon,
  FileText,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Layers,
  CheckCircle2,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/store'
import { formatDate } from '@/lib/utils'

interface SkillItem {
  id: string
  name: string
  description?: string | null
  type: string
  prompt?: string | null
  version: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    skillCaches?: number
    schedules?: number
  }
}

const SKILL_TYPES = [
  {
    value: 'VULNERABILITY_REMEDIATION',
    label: 'Vulnerability → Remediation',
    icon: Database,
    desc: 'Reads existing vulnerabilities and generates remediation tasks stored in the vector cache table.',
    inputSource: 'Existing Vulnerabilities (Table)',
    outputTarget: 'Remediation Tasks & Vector Cache',
  },
  {
    value: 'DOCUMENT_ANALYSIS',
    label: 'Document-Based Threat Extractor',
    icon: FileText,
    desc: 'Reads uploaded architecture documents & SOC playbooks to extract threat mappings into dedicated cache records.',
    inputSource: 'Uploaded Documents / Text Whitepapers',
    outputTarget: 'Document Mapping Cache Records',
  },
  {
    value: 'HISTORICAL_ANALYZER',
    label: 'Historical Analyzer (Batch)',
    icon: Database,
    desc: 'Iterates through resolved vulnerability history in configurable batches to mine high-dimensional patterns.',
    inputSource: 'Historical Vulnerability Records',
    outputTarget: 'Pattern Vector Cache',
  },
  {
    value: 'REMEDIATION_LINKER',
    label: 'Semantic Remediation Linker',
    icon: LinkIcon,
    desc: 'Cosine semantic search over cached pattern vectors to forge automated links to active security tickets.',
    inputSource: 'Active Tickets & Pattern Cache',
    outputTarget: 'Vulnerability-Remediation Links',
  },
  {
    value: 'CUSTOM',
    label: 'Custom Analyst Skill',
    icon: Cpu,
    desc: 'User-defined agent skill with custom LLM prompt instructions and configurable parameters.',
    inputSource: 'Custom Parameter Schema',
    outputTarget: 'Configurable Target',
  },
]

const emptyForm = {
  name: '',
  description: '',
  type: 'VULNERABILITY_REMEDIATION',
  prompt: '',
  version: '1.0.0',
  isActive: true,
}

export default function SkillsPage() {
  const { setIsAgentModalOpen } = useAppStore()
  const queryClient = useQueryClient()
  const [runningSkillId, setRunningSkillId] = useState<string | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingSkill, setEditingSkill] = useState<SkillItem | null>(null)
  const [expandedPromptId, setExpandedPromptId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...emptyForm })

  const { data: skillsData, isLoading } = useQuery({
    queryKey: ['skills'],
    queryFn: async () => {
      const res = await fetch('/api/skills')
      if (!res.ok) throw new Error('Failed to fetch skills')
      return res.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create skill')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] })
      setIsAddOpen(false)
      setForm({ ...emptyForm })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/skills/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update skill')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] })
      setEditingSkill(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/skills/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete skill')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] })
    },
  })

  const skills: SkillItem[] = skillsData?.data || []

  const handleRunSingleSkill = async (skill: SkillItem) => {
    setRunningSkillId(skill.id)
    try {
      const payload: any = {}
      if (skill.type === 'DOCUMENT_ANALYSIS') {
        payload.documentTitle = 'SOC Runbook 2026 - Threat Mitigation Guideline'
      }

      const res = await fetch(`/api/skills/${skill.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await res.json()
      alert(
        `Skill "${skill.name}" executed successfully!\nProcessed: ${JSON.stringify(
          result.data?.cacheCreated ?? '1 record'
        )} cache entries.`
      )
      queryClient.invalidateQueries({ queryKey: ['skills'] })
      queryClient.invalidateQueries({ queryKey: ['cache'] })
    } catch (err: any) {
      alert(`Error running skill: ${err.message}`)
    } finally {
      setRunningSkillId(null)
    }
  }

  const handleOpenEdit = (skill: SkillItem) => {
    setForm({
      name: skill.name,
      description: skill.description || '',
      type: skill.type,
      prompt: skill.prompt || '',
      version: skill.version,
      isActive: skill.isActive,
    })
    setEditingSkill(skill)
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return

    if (editingSkill) {
      updateMutation.mutate({ id: editingSkill.id, data: form })
    } else {
      createMutation.mutate(form)
    }
  }

  const getTypeMeta = (type: string) => {
    return SKILL_TYPES.find((t) => t.value === type) || SKILL_TYPES[0]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-text-primary">
              Skills & Agents
            </h1>
            <Badge variant="outline" className="border-accent/40 text-accent text-[10px] font-mono">
              Vector RAG Engine
            </Badge>
          </div>
          <p className="text-xs text-text-secondary">
            Manage customizable agent skills with editable prompts, inputs, and cache destinations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsAgentModalOpen(true)}
            variant="outline"
            size="sm"
            className="text-xs h-8 gap-1.5 border-accent/40 text-accent hover:bg-accent/10"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            Run Full Pipeline
          </Button>

          <Button
            onClick={() => {
              setForm({ ...emptyForm })
              setIsAddOpen(true)
            }}
            size="sm"
            className="text-xs h-8 gap-1.5 bg-accent hover:bg-accent-hover text-black font-bold shadow-glow-green-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Custom Skill
          </Button>
        </div>
      </div>

      {/* Visual Pipeline Concept Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-surface border border-border space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center">
              <Database className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="text-xs font-semibold text-text-primary">
                Skill 1: Vulnerability → Remediation
              </p>
              <span className="text-[10px] text-accent font-mono">Input: Vulnerabilities Table</span>
            </div>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            Consumes existing open/resolved vulnerabilities. Analyzes root cause via LLM prompt to create concrete remediation tasks, which are persisted to the vector cache table.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <FileText className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-text-primary">
                Skill 2: Document-Based Security Extractor
              </p>
              <span className="text-[10px] text-emerald-400 font-mono">Input: Architecture Whitepapers</span>
            </div>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            Parses uploaded documents, architecture specs, or SOC guidelines. Synthesizes defensive rules and stores threat-mitigation mappings in dedicated document cache records.
          </p>
        </div>
      </div>

      {/* Skills Table (List View) */}
      <div className="rounded-lg border border-border overflow-hidden bg-surface">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-surface-2">
              <TableHead className="text-[10px] text-text-muted uppercase tracking-wider">
                Skill Name & Focus
              </TableHead>
              <TableHead className="text-[10px] text-text-muted uppercase tracking-wider">
                Type
              </TableHead>
              <TableHead className="text-[10px] text-text-muted uppercase tracking-wider">
                Version
              </TableHead>
              <TableHead className="text-[10px] text-text-muted uppercase tracking-wider hidden md:table-cell">
                Cache Mappings
              </TableHead>
              <TableHead className="text-[10px] text-text-muted uppercase tracking-wider hidden lg:table-cell">
                Created On
              </TableHead>
              <TableHead className="text-[10px] text-text-muted uppercase tracking-wider hidden lg:table-cell">
                Updated On
              </TableHead>
              <TableHead className="text-[10px] text-text-muted uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="text-[10px] text-text-muted uppercase tracking-wider text-right pr-4">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full bg-surface-2" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : skills.length === 0 ? (
              <TableRow className="border-border">
                <TableCell colSpan={8} className="text-center py-12 text-text-muted text-sm">
                  <Cpu className="w-8 h-8 mx-auto mb-2 text-text-muted/40" />
                  No skills configured yet. Add your first agent skill.
                </TableCell>
              </TableRow>
            ) : (
              skills.map((skill) => {
                const meta = getTypeMeta(skill.type)
                const Icon = meta.icon
                const isRunning = runningSkillId === skill.id
                const isExpanded = expandedPromptId === skill.id

                return (
                  <React.Fragment key={skill.id}>
                    <TableRow className="border-border hover:bg-surface-2 transition-colors">
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface-2 border border-border shrink-0">
                            <Icon className="w-4 h-4 text-accent" />
                          </div>
                          <div className="space-y-0.5 max-w-sm">
                            <p className="text-xs font-semibold text-text-primary">{skill.name}</p>
                            <p className="text-[11px] text-text-muted line-clamp-1">
                              {skill.description || meta.desc}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="text-[10px] font-mono text-text-secondary bg-surface-2 px-2 py-0.5 rounded border border-border">
                          {skill.type.replace(/_/g, ' ')}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span className="text-[10px] font-mono text-accent px-1.5 py-0.5 rounded bg-accent/10 border border-accent/20 font-bold">
                          v{skill.version}
                        </span>
                      </TableCell>

                      <TableCell className="hidden md:table-cell">
                        <span className="text-xs font-mono text-text-primary font-semibold">
                          {skill._count?.skillCaches ?? 0}
                        </span>
                      </TableCell>

                      <TableCell className="hidden lg:table-cell text-xs text-text-muted font-mono">
                        {formatDate(skill.createdAt)}
                      </TableCell>

                      <TableCell className="hidden lg:table-cell text-xs text-text-muted font-mono">
                        {formatDate(skill.updatedAt)}
                      </TableCell>

                      <TableCell>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            skill.isActive
                              ? 'bg-accent/15 text-accent border border-accent/30 font-bold'
                              : 'bg-surface-2 text-text-muted border border-border'
                          }`}
                        >
                          {skill.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </TableCell>

                      <TableCell className="text-right pr-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() =>
                              setExpandedPromptId(isExpanded ? null : skill.id)
                            }
                            className="p-1.5 rounded hover:bg-surface-3 text-text-muted hover:text-text-primary transition-all"
                            title={isExpanded ? 'Hide prompt' : 'View prompt'}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            onClick={() => handleOpenEdit(skill)}
                            className="p-1.5 rounded hover:bg-surface-3 text-text-muted hover:text-text-primary transition-all"
                            title="Edit skill definition & prompt"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleRunSingleSkill(skill)}
                            disabled={isRunning}
                            className="p-1.5 rounded hover:bg-accent/10 text-accent transition-all disabled:opacity-40"
                            title="Execute skill"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Delete skill "${skill.name}"?`)) {
                                deleteMutation.mutate(skill.id)
                              }
                            }}
                            className="p-1.5 rounded hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-all"
                            title="Delete skill"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expandable Prompt Drawer / Inspector */}
                    {isExpanded && (
                      <TableRow className="border-border bg-surface-2/60">
                        <TableCell colSpan={8} className="py-4 px-6">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                                Skill Prompt Definition (LLM System & Task Instruction)
                              </p>
                              <div className="flex items-center gap-3 text-[11px] text-text-muted">
                                <span>Input: {meta.inputSource}</span>
                                <span>•</span>
                                <span>Destination: {meta.outputTarget}</span>
                              </div>
                            </div>
                            <pre className="text-xs text-text-secondary leading-relaxed font-mono whitespace-pre-wrap p-3.5 rounded-lg bg-surface border border-border">
                              {skill.prompt ||
                                'No prompt provided. Default heuristic behavior is currently active.'}
                            </pre>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add / Edit Skill Modal */}
      <Dialog
        open={isAddOpen || !!editingSkill}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false)
            setEditingSkill(null)
          }
        }}
      >
        <DialogContent className="bg-surface border-border max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-text-primary">
              {editingSkill ? `Edit Skill: ${editingSkill.name}` : 'Add New Agent Skill'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-text-secondary">Skill Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Zero-Day Vulnerability Triage Skill"
                className="bg-surface-2 border-border text-text-primary text-sm h-9"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-text-secondary">Skill Type</Label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full h-9 px-2 text-sm rounded-md bg-surface-2 border border-border text-text-primary"
                >
                  {SKILL_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-text-secondary">Version</Label>
                <Input
                  value={form.version}
                  onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
                  placeholder="1.0.0"
                  className="bg-surface-2 border-border text-text-primary text-sm h-9 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-text-secondary">Skill Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="High-level description of what this skill achieves..."
                className="bg-surface-2 border-border text-text-primary text-sm h-9"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-text-secondary">
                  Skill Prompt <span className="text-text-muted">(LLM Guidance & Task Prompt)</span>
                </Label>
                <span className="text-[10px] text-accent font-mono">
                  {getTypeMeta(form.type).inputSource}
                </span>
              </div>
              <div className="p-2.5 rounded bg-surface-2 border border-border text-[11px] text-text-muted">
                {getTypeMeta(form.type).desc}
              </div>
              <Textarea
                value={form.prompt}
                onChange={(e) => setForm((f) => ({ ...f, prompt: e.target.value }))}
                placeholder="You are a security intelligence analyzer. When evaluating input data, extract root causes and generate precise patch recommendations..."
                className="bg-surface-2 border-border text-text-primary text-sm resize-none font-mono"
                rows={5}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-2 border border-border">
              <div>
                <p className="text-xs font-semibold text-text-primary">Enable Skill</p>
                <p className="text-[11px] text-text-muted">
                  Make this skill available for scheduled and batch agent execution
                </p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, isActive: checked }))}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAddOpen(false)
                  setEditingSkill(null)
                }}
                className="border-border text-text-secondary text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-accent hover:bg-accent-hover text-black font-bold text-xs"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Saving...'
                  : editingSkill
                  ? 'Update Skill'
                  : 'Save Skill'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
