'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Calendar,
  Plus,
  Play,
  Clock,
  CheckCircle2,
  XCircle,
  Trash2,
  Sparkles,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDate } from '@/lib/utils'

export default function SchedulePage() {
  const queryClient = useQueryClient()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [name, setName] = useState('')
  const [skillId, setSkillId] = useState('')
  const [cronExpression, setCronExpression] = useState('0 2 * * *')

  const { data: skillsData } = useQuery({
    queryKey: ['skills'],
    queryFn: async () => {
      const res = await fetch('/api/skills')
      if (!res.ok) throw new Error('Failed to fetch skills')
      return res.json()
    },
  })
  const skills = skillsData?.data || []

  const { data: scheduleData, isLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: async () => {
      const res = await fetch('/api/schedules')
      if (!res.ok) throw new Error('Failed to fetch schedules')
      return res.json()
    },
  })
  const schedules = scheduleData?.data || []

  const createSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !skillId) return

    await fetch('/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, skillId, cronExpression, isActive: true }),
    })

    setIsAddOpen(false)
    setName('')
    setSkillId('')
    queryClient.invalidateQueries({ queryKey: ['schedules'] })
  }

  const toggleSchedule = async (id: string, currentActive: boolean) => {
    await fetch(`/api/schedules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !currentActive }),
    })
    queryClient.invalidateQueries({ queryKey: ['schedules'] })
  }

  const deleteSchedule = async (id: string) => {
    if (confirm('Delete this automated schedule?')) {
      await fetch(`/api/schedules/${id}`, { method: 'DELETE' })
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
    }
  }

  const triggerTick = async () => {
    try {
      const res = await fetch('/api/schedule/tick')
      const json = await res.json()
      alert(`Triggered ${json.triggeredCount || 0} active schedule job(s).`)
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
    } catch (e: any) {
      alert(`Error triggering scheduler: ${e.message}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-text-primary">
              Automated Schedule
            </h1>
            <Badge variant="outline" className="border-border text-text-muted text-[10px]">
              {schedules.length} Jobs Configured
            </Badge>
          </div>
          <p className="text-xs text-text-secondary">
            Continuous background evaluation of security posture via cron execution hooks
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={triggerTick}
            className="text-xs h-8 gap-1.5 border-border text-text-secondary hover:text-text-primary"
          >
            <Clock className="w-3.5 h-3.5" />
            Trigger Cron Tick
          </Button>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="text-xs h-8 gap-1.5 bg-accent hover:bg-accent-hover text-black font-bold shadow-glow-green-sm">
                <Plus className="w-3.5 h-3.5" />
                Add Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-surface border-border">
              <DialogHeader>
                <DialogTitle className="text-base text-text-primary">
                  Configure Skill Schedule
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={createSchedule} className="space-y-3.5 py-2">
                <div className="space-y-1">
                  <Label htmlFor="s-name">Job Name *</Label>
                  <Input
                    id="s-name"
                    placeholder="e.g. Daily Vulnerability Pattern Miner"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="s-skill">Agent Skill *</Label>
                  <select
                    id="s-skill"
                    value={skillId}
                    onChange={(e) => setSkillId(e.target.value)}
                    required
                    className="flex h-9 w-full rounded-md border border-border bg-surface-2 px-3 py-1 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="">Select Target Skill...</option>
                    {skills.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="s-cron">Cron Expression *</Label>
                  <Input
                    id="s-cron"
                    placeholder="0 2 * * *"
                    value={cronExpression}
                    onChange={(e) => setCronExpression(e.target.value)}
                    required
                  />
                  <p className="text-[10px] text-text-muted">
                    Format: minute hour day-of-month month day-of-week (e.g. &apos;0 2 * * *&apos; = 2 AM daily)
                  </p>
                </div>

                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="bg-accent hover:bg-accent-hover text-black font-bold shadow-glow-green-sm">
                    Save Schedule
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Schedules List Cards */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : schedules.length === 0 ? (
        <div className="figma-card p-12 text-center space-y-3">
          <Calendar className="w-8 h-8 text-text-muted mx-auto" />
          <p className="text-sm font-medium text-text-secondary">No automated schedules configured</p>
          <p className="text-xs text-text-muted">
            Set up cron triggers to continuously scan and link security remediations.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map((sch: any) => {
            const history = (sch.runHistory as any[]) || []

            return (
              <div
                key={sch.id}
                className="p-5 rounded-lg bg-surface border border-border space-y-3 hover:border-border-light transition-all shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary">
                        {sch.name}
                      </h4>
                      <p className="text-[11px] text-text-muted">
                        Skill: <span className="text-text-secondary">{sch.skill?.name || 'Assigned Agent'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface-3 text-text-secondary border border-border">
                      {sch.cronExpression}
                    </span>
                    <Switch
                      checked={sch.isActive}
                      onCheckedChange={() => toggleSchedule(sch.id, sch.isActive)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteSchedule(sch.id)}
                      className="h-8 w-8 text-text-muted hover:text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* History telemetry dots */}
                <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-text-muted">Run History (Recent):</span>
                    {history.length > 0 ? (
                      <div className="flex items-center gap-1.5">
                        {history.slice(0, 10).map((h, i) => (
                          <span
                            key={i}
                            title={`${h.status} at ${formatDate(h.timestamp)}: ${h.message || ''}`}
                            className={`w-2 h-2 rounded-full cursor-help ${
                              h.status === 'SUCCESS' ? 'bg-emerald-400' : 'bg-red-400'
                            }`}
                          />
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-text-muted">No runs recorded yet</span>
                    )}
                  </div>

                  <div className="text-[11px] text-text-muted">
                    Last execution:{' '}
                    <span className="text-text-secondary font-mono">
                      {sch.lastRunAt ? formatDate(sch.lastRunAt) : 'Never'}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
