'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/store'
import { useAgentStream } from '@/hooks/useAgentStream'
import {
  Play,
  Square,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Database,
  Link as LinkIcon,
  Layers,
  ChevronRight,
  Clock,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

export function AgentRunModal() {
  const { isAgentModalOpen, setIsAgentModalOpen } = useAppStore()
  const queryClient = useQueryClient()
  const { isRunning, events, error, summary, startPipeline, stopPipeline } = useAgentStream()

  const [batchSize, setBatchSize] = useState(50)
  const [threshold, setThreshold] = useState(0.7)
  const [dryRun, setDryRun] = useState(false)

  const handleStart = async () => {
    await startPipeline({
      batchSize,
      confidenceThreshold: threshold,
      dryRun,
    })
    queryClient.invalidateQueries({ queryKey: ['vulnerabilities'] })
    queryClient.invalidateQueries({ queryKey: ['remediations'] })
    queryClient.invalidateQueries({ queryKey: ['cache'] })
    queryClient.invalidateQueries({ queryKey: ['skills'] })
  }

  const lastProgressEvent = [...events].reverse().find((e) => e.event === 'progress')
  const progressPercent = lastProgressEvent?.data?.total
    ? Math.round(((lastProgressEvent.data.processed as number) / (lastProgressEvent.data.total as number)) * 100)
    : isRunning
    ? 45
    : summary
    ? 100
    : 0

  return (
    <Dialog open={isAgentModalOpen} onOpenChange={setIsAgentModalOpen}>
      <DialogContent className="max-w-2xl bg-surface border-border text-white p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-border bg-black/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/40 flex items-center justify-center text-accent shadow-glow-green-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-white">
                  RAG Agent Pipeline Orchestrator
                </DialogTitle>
                <DialogDescription className="text-xs text-text-secondary">
                  Execute Skill 1 (Pattern Miner) and Skill 2 (Remediation Linker) with real-time SSE telemetry
                </DialogDescription>
              </div>
            </div>
            {isRunning && (
              <Badge variant="outline" className="border-accent text-accent animate-pulse text-[11px] font-mono">
                Running Agent...
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Configuration settings when not running */}
        {!isRunning && !summary && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3.5 rounded-lg border border-border bg-surface-2 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-white font-medium">Batch Extraction Size</Label>
                  <span className="font-mono text-xs text-accent font-bold">{batchSize}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="10"
                  value={batchSize}
                  onChange={(e) => setBatchSize(Number(e.target.value))}
                  className="w-full accent-accent bg-surface-3 cursor-pointer"
                />
                <p className="text-[11px] text-text-muted">
                  Vulnerabilities analyzed per execution cycle
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-border bg-surface-2 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-white font-medium">Cosine Match Threshold</Label>
                  <span className="font-mono text-xs text-accent font-bold">{threshold}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="0.95"
                  step="0.05"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full accent-accent bg-surface-3 cursor-pointer"
                />
                <p className="text-[11px] text-text-muted">
                  Minimum semantic similarity score to create link
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-surface-2">
              <div className="space-y-0.5">
                <Label className="text-xs text-white font-medium">Simulation Mode (Dry Run)</Label>
                <p className="text-[11px] text-text-muted">
                  Compute vector matches without inserting tasks into database
                </p>
              </div>
              <Switch checked={dryRun} onCheckedChange={setDryRun} />
            </div>
          </div>
        )}

        {/* Live SSE Stream Console */}
        {(isRunning || events.length > 0) && (
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-text-secondary">
                <span>Execution Progress</span>
                <span className="font-mono text-accent font-bold">{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="h-1.5" />
            </div>

            {/* Event Log Output */}
            <div className="h-52 overflow-y-auto rounded-lg bg-black border border-border p-3 font-mono text-[11px] space-y-2">
              {events.map((evt, idx) => {
                let badgeColor = 'text-text-muted'
                if (evt.event === 'start') badgeColor = 'text-accent'
                if (evt.event === 'skill_start') badgeColor = 'text-accent font-bold'
                if (evt.event === 'progress') badgeColor = 'text-amber-400'
                if (evt.event === 'skill_complete') badgeColor = 'text-accent font-bold'
                if (evt.event === 'complete') badgeColor = 'text-accent font-bold'
                if (evt.event === 'error') badgeColor = 'text-red-400'

                return (
                  <div key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-text-muted select-none">[{idx + 1}]</span>
                    <span className={`uppercase text-[10px] px-1 py-0.2 rounded bg-surface-2 ${badgeColor}`}>
                      {evt.event}
                    </span>
                    <span className="text-text-secondary">
                      {evt.event === 'progress' &&
                        `Processed ${evt.data.processed}/${evt.data.total} items (${evt.data.remediationsCreated || 0} remediations)`}
                      {evt.event === 'skill_start' && `Launching ${evt.data.name || evt.data.skillId}`}
                      {evt.event === 'skill_complete' &&
                        `Finished in ${evt.data.duration}ms. Cache entries: ${evt.data.cacheCreated ?? 'N/A'}`}
                      {evt.event === 'start' && (evt.data.message as string)}
                      {evt.event === 'complete' && 'Pipeline execution complete.'}
                      {evt.event === 'error' && (evt.data.message as string)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Summary Card when finished */}
        {summary && (
          <div className="px-6 pb-2">
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-lg bg-surface-2 border border-accent/40 shadow-glow-green-sm">
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4 text-accent" />
                <div>
                  <p className="text-[10px] uppercase text-text-muted font-mono font-bold">Patterns Cached</p>
                  <p className="text-sm font-bold text-white font-mono">
                    {String(summary.cacheEntries || 0)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-accent" />
                <div>
                  <p className="text-[10px] uppercase text-text-muted font-mono font-bold">Remediations</p>
                  <p className="text-sm font-bold text-white font-mono">
                    {String(summary.remediationsCreated || 0)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <LinkIcon className="w-4 h-4 text-accent" />
                <div>
                  <p className="text-[10px] uppercase text-text-muted font-mono font-bold">Links Formed</p>
                  <p className="text-sm font-bold text-white font-mono">
                    {String(summary.linksCreated || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer controls */}
        <DialogFooter className="p-4 border-t border-border bg-black/60 flex items-center justify-between">
          <div className="text-[11px] text-text-muted font-mono">
            edocode455 • LangChain.js & pgvector
          </div>
          <div className="flex items-center gap-2">
            {isRunning ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={stopPipeline}
                className="gap-1.5 text-xs h-8"
              >
                <Square className="w-3.5 h-3.5" />
                Stop Execution
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAgentModalOpen(false)}
                  className="text-xs h-8"
                >
                  Close
                </Button>
                <Button
                  onClick={handleStart}
                  size="sm"
                  className="gap-1.5 text-xs h-8 bg-accent hover:bg-accent-hover text-black font-bold shadow-glow-green-sm"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {summary ? 'Run Again' : 'Execute Pipeline'}
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
