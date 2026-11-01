'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  GitBranch,
  Github,
  Search,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Layers,
  ArrowRight,
  Database,
  FileCode,
  Star,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { getSeverityBadgeClass, formatDate } from '@/lib/utils'
import { useAppStore } from '@/store'

const SAMPLE_REPOS = [
  { name: 'expressjs/express', label: 'Express.js (Node)', lang: 'JavaScript' },
  { name: 'apache/logging-log4j2', label: 'Apache Log4j2 (Java)', lang: 'Java' },
  { name: 'pallets/flask', label: 'Flask (Python)', lang: 'Python' },
  { name: 'facebook/react', label: 'React (Web)', lang: 'TypeScript' },
]

export default function ScannerPage() {
  const queryClient = useQueryClient()
  const { setIsAgentModalOpen } = useAppStore()

  const [repoUrl, setRepoUrl] = useState('')
  const [githubToken, setGithubToken] = useState('')
  const [showTokenField, setShowTokenField] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<any | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Fetch past scan ingestions
  const { data: pastScansData, isLoading: isLoadingPast } = useQuery({
    queryKey: ['scanner-history'],
    queryFn: async () => {
      const res = await fetch('/api/scanner')
      if (!res.ok) throw new Error('Failed to load scan history')
      return res.json()
    },
  })
  const pastScannedVulns = pastScansData?.data || []

  const handleScan = async (e?: React.FormEvent, overrideUrl?: string) => {
    if (e) e.preventDefault()
    const targetUrl = overrideUrl || repoUrl
    if (!targetUrl.trim()) return

    setIsScanning(true)
    setErrorMsg(null)

    try {
      const res = await fetch('/api/scanner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl: targetUrl.trim(),
          githubToken: githubToken.trim() || undefined,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || 'Failed to scan repository')
      }

      setScanResult(json.data)
      // Invalidate vulnerabilities query so the main table updates immediately
      queryClient.invalidateQueries({ queryKey: ['vulnerabilities'] })
      queryClient.invalidateQueries({ queryKey: ['scanner-history'] })
    } catch (err: any) {
      setErrorMsg(err.message || 'Scanning encountered an error')
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-text-primary">
              GitHub Repository Scanner
            </h1>
            <Badge variant="outline" className="border-accent/40 text-accent text-[10px]">
              Dependency & SAST Auditor
            </Badge>
          </div>
          <p className="text-xs text-text-secondary">
            Scan open-source or private GitHub codebases, identify security vulnerabilities, and ingest them directly into your database
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/vulnerabilities">
            <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5 border-border text-text-secondary hover:text-text-primary">
              <ShieldAlert className="w-3.5 h-3.5" />
              View Vulnerabilities Table
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={() => setIsAgentModalOpen(true)}
            className="text-xs h-8 gap-1.5 bg-accent hover:bg-accent-hover text-black font-bold shadow-glow-green-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Run RAG Remediation
          </Button>
        </div>
      </div>

      {/* Main Scanner Input Card */}
      <div className="p-6 rounded-lg bg-surface border border-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-text-primary">
              <Github className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
                Target Repository Specification
              </h3>
              <p className="text-[11px] text-text-muted">
                Enter any public GitHub repo URL or private repo with access token
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowTokenField(!showTokenField)}
            className="text-[11px] text-accent hover:underline flex items-center gap-1"
          >
            <Lock className="w-3 h-3" />
            {showTokenField ? 'Hide Private Access Token' : '+ Add GitHub Token (Private Repos)'}
          </button>
        </div>

        <form onSubmit={(e) => handleScan(e)} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <GitBranch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <Input
                placeholder="https://github.com/owner/repository  or  owner/repository"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                required
                className="pl-9 h-10 bg-surface-2 border-border text-xs text-text-primary font-mono placeholder:font-sans"
              />
            </div>
            <Button
              type="submit"
              disabled={isScanning || !repoUrl.trim()}
              className="h-10 px-5 gap-2 bg-accent hover:bg-accent-hover text-black font-bold text-xs shrink-0 shadow-glow-green-sm"
            >
              {isScanning ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Auditing Repository...
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  Scan & Ingest
                </>
              )}
            </Button>
          </div>

          {showTokenField && (
            <div className="p-3 rounded bg-surface-2 border border-border space-y-1">
              <label className="text-[11px] text-text-secondary font-medium">
                GitHub Personal Access Token (classic or fine-grained with `repo:read`)
              </label>
              <Input
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                className="h-8 bg-surface-3 border-border text-xs font-mono"
              />
            </div>
          )}

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <span className="text-[10px] uppercase text-text-muted font-bold">Quick Examples:</span>
            {SAMPLE_REPOS.map((sample) => (
              <button
                key={sample.name}
                type="button"
                onClick={() => {
                  setRepoUrl(sample.name)
                  handleScan(undefined, sample.name)
                }}
                className="px-2 py-0.5 rounded bg-surface-2 hover:bg-surface-3 border border-border text-[11px] text-text-secondary hover:text-text-primary transition"
              >
                {sample.label}
              </button>
            ))}
          </div>
        </form>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Active Scan Results Banner */}
      {scanResult && (
        <div className="p-5 rounded-lg bg-surface border border-emerald-500/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-text-primary">
                    {scanResult.fullName}
                  </h3>
                  <a
                    href={`https://github.com/${scanResult.fullName}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-text-muted hover:text-accent"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <p className="text-[11px] text-text-secondary">
                  {scanResult.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2 py-0.5 rounded bg-surface-2 border border-border text-text-secondary">
                Lang: <span className="text-text-primary font-semibold">{scanResult.language}</span>
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-surface-2 border border-border text-text-secondary flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="text-text-primary font-semibold">{scanResult.stars}</span>
              </span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded bg-surface-2 border border-border space-y-0.5">
              <span className="text-[10px] uppercase text-text-muted font-bold">Manifests Inspected</span>
              <p className="font-mono text-text-primary font-semibold">
                {scanResult.manifestsFound.join(', ') || 'Repository source files'}
              </p>
            </div>
            <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/30 space-y-0.5">
              <span className="text-[10px] uppercase text-emerald-400 font-bold">Added to Table</span>
              <p className="font-mono text-emerald-400 font-bold text-sm">
                +{scanResult.createdCount} Vulnerability Records
              </p>
            </div>
            <div className="p-3 rounded bg-surface-2 border border-border space-y-0.5">
              <span className="text-[10px] uppercase text-text-muted font-bold">Already Tracked</span>
              <p className="font-mono text-text-secondary font-semibold">
                {scanResult.alreadyExistingCount} Records
              </p>
            </div>
          </div>

          {/* Table of Discovered Vulnerabilities */}
          <div className="figma-card overflow-hidden">
            <div className="px-4 py-2.5 bg-surface-2 border-b border-border flex items-center justify-between">
              <span className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                Extracted Threats & Advisory Mappings ({scanResult.vulnerabilities.length})
              </span>
              <Link href="/vulnerabilities" className="text-[11px] text-accent hover:underline flex items-center gap-1">
                View in Vulnerabilities Tab <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <Table className="min-w-[650px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[130px]">CVE / Advisory</TableHead>
                  <TableHead>Threat Title & Overview</TableHead>
                  <TableHead className="w-[100px]">Severity</TableHead>
                  <TableHead className="w-[80px]">CVSS</TableHead>
                  <TableHead className="w-[140px]">Affected Target</TableHead>
                  <TableHead className="w-[110px]">Ingestion Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scanResult.vulnerabilities.map((vuln: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono text-xs text-text-secondary">
                      {vuln.cveId}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <span className="font-semibold text-xs text-text-primary">
                          {vuln.title}
                        </span>
                        <p className="text-[11px] text-text-muted leading-relaxed line-clamp-1">
                          {vuln.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getSeverityBadgeClass(vuln.severity)}`}>
                        {vuln.severity}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-text-secondary">
                      {vuln.cvssScore ? Number(vuln.cvssScore).toFixed(1) : '7.0'}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-text-muted">
                      {vuln.affectedSystem}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        Ingested
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </div>
        </div>
      )}

      {/* Past Repository Scan Ingestions Section */}
      <div className="p-5 rounded-lg bg-surface border border-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-accent" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
              Recently Ingested from Repositories ({pastScannedVulns.length})
            </h3>
          </div>
          <Link href="/vulnerabilities" className="text-[11px] text-accent hover:underline">
            Manage all in Vulnerabilities Table &rarr;
          </Link>
        </div>

        {isLoadingPast ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : pastScannedVulns.length === 0 ? (
          <div className="p-8 text-center text-xs text-text-muted">
            No repositories have been scanned yet. Input a GitHub repository above to start!
          </div>
        ) : (
          <div className="figma-card overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="min-w-[650px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[130px]">CVE / ID</TableHead>
                  <TableHead>Vulnerability</TableHead>
                  <TableHead className="w-[100px]">Severity</TableHead>
                  <TableHead className="w-[140px]">Repository Source</TableHead>
                  <TableHead className="w-[120px]">Discovered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pastScannedVulns.slice(0, 8).map((vuln: any) => (
                  <TableRow key={vuln.id}>
                    <TableCell className="font-mono text-xs text-text-secondary">
                      {vuln.cveId || 'SCAN'}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-xs text-text-primary">
                        {vuln.title}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getSeverityBadgeClass(vuln.severity)}`}>
                        {vuln.severity}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-text-muted">
                      {vuln.affectedSystem || 'Repository'}
                    </TableCell>
                    <TableCell className="text-xs text-text-muted font-mono">
                      {formatDate(vuln.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
