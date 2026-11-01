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
import { Skeleton } from '@/components/ui/skeleton'
import {
  Database,
  Search,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { formatDate } from '@/lib/utils'

export default function CachePage() {
  const [semanticQuery, setSemanticQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[] | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  // Standard cache query
  const { data: cacheData, isLoading } = useQuery({
    queryKey: ['cache'],
    queryFn: async () => {
      const res = await fetch('/api/cache?limit=50')
      if (!res.ok) throw new Error('Failed to fetch cache')
      return res.json()
    },
  })

  const handleSemanticSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!semanticQuery.trim()) {
      setSearchResults(null)
      return
    }

    setIsSearching(true)
    try {
      const res = await fetch('/api/cache/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: semanticQuery, threshold: 0.5, limit: 10 }),
      })
      const json = await res.json()
      setSearchResults(json.data || [])
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setIsSearching(false)
    }
  }

  const entries = searchResults || cacheData?.data || []
  const isCustomSearchResult = searchResults !== null

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-text-primary">
              Pattern Cache & Vectors
            </h1>
            <Badge variant="outline" className="border-border text-text-muted text-[10px]">
              {cacheData?.meta?.total ?? entries.length} Stored Vectors
            </Badge>
          </div>
          <p className="text-xs text-text-secondary">
            Semantic intelligence extracted by Skill 1 and indexed via pgvector embeddings
          </p>
        </div>
      </div>

      {/* Semantic Search Sandbox */}
      <div className="p-4 rounded-lg bg-surface border border-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-xs font-semibold text-text-primary uppercase tracking-wider">
              Semantic Search Tester (Vector Similarity)
            </span>
          </div>
          {isCustomSearchResult && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchResults(null)
                setSemanticQuery('')
              }}
              className="text-[11px] h-6 text-text-muted hover:text-text-primary"
            >
              Clear Search
            </Button>
          )}
        </div>

        <form onSubmit={handleSemanticSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input
              placeholder="Test cosine similarity (e.g. 'unauthorized bypass in token refresh handler')..."
              value={semanticQuery}
              onChange={(e) => setSemanticQuery(e.target.value)}
              className="pl-8 text-xs h-9 bg-surface-2 border-border"
            />
          </div>
          <Button
            type="submit"
            disabled={isSearching}
            size="sm"
            className="text-xs h-9 px-4 bg-accent hover:bg-accent-hover text-black font-bold shadow-glow-green-sm"
          >
            {isSearching ? 'Embedding & Matching...' : 'Vector Search'}
          </Button>
        </form>
      </div>

      {/* Cache Table */}
      <div className="figma-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Database className="w-8 h-8 text-text-muted mx-auto" />
            <p className="text-sm font-medium text-text-secondary">Cache is empty</p>
            <p className="text-xs text-text-muted">
              Run the RAG pipeline or trigger Skill 1 to generate historical vulnerability pattern embeddings.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Source Vulnerability</TableHead>
                <TableHead>Extracted Pattern Summary</TableHead>
                {isCustomSearchResult && (
                  <TableHead className="w-[120px]">Cosine Match</TableHead>
                )}
                <TableHead className="w-[110px]">Indexed</TableHead>
                <TableHead className="w-[100px]">Expires</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry: any) => {
                const vuln = entry.vulnerability

                return (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="space-y-0.5">
                        <span className="font-medium text-xs text-text-primary">
                          {vuln?.cveId || 'ID'}
                        </span>
                        <p className="text-[11px] text-text-muted line-clamp-1">
                          {vuln?.title || 'System Pattern'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        {entry.pattern_summary || entry.patternSummary}
                      </p>
                    </TableCell>
                    {isCustomSearchResult && (
                      <TableCell>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                          {((entry.similarity || 0) * 100).toFixed(1)}%
                        </span>
                      </TableCell>
                    )}
                    <TableCell className="text-xs text-text-muted font-mono">
                      {formatDate(entry.createdAt || entry.created_at)}
                    </TableCell>
                    <TableCell className="text-xs text-text-muted font-mono">
                      {formatDate(entry.expiresAt || entry.expires_at)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
