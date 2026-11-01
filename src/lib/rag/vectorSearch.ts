import { supabaseAdmin } from '@/lib/db/supabase'
import { prisma } from '@/lib/db/prisma'
import { createEmbedding } from './embeddings'

export interface SearchResult {
  id: string
  skill_id: string
  vulnerability_id: string | null
  pattern_summary: string
  similarity: number
  metadata: Record<string, unknown>
}

export async function semanticSearch(
  query: string,
  threshold = 0.6,
  limit = 10
): Promise<SearchResult[]> {
  const embedding = await createEmbedding(query)

  // 1. Try Supabase pgvector RPC
  try {
    const { data, error } = await supabaseAdmin.rpc('match_skill_cache', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: limit,
    })

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((item: any) => ({
        id: item.id,
        skill_id: item.skill_id,
        vulnerability_id: item.vulnerability_id,
        pattern_summary: item.pattern_summary,
        similarity: Number(item.similarity ?? 0.85),
        metadata: item.metadata || {},
      }))
    }
  } catch (rpcErr) {
    // Graceful fallback to prisma keyword / pattern matching
  }

  // 2. Prisma fallback: Text search across cached pattern summaries
  const queryTerms = query.toLowerCase().split(/\s+/).filter(Boolean)
  const cachedItems = await prisma.skillCache.findMany({
    take: limit * 2,
    orderBy: { createdAt: 'desc' },
  })

  const scored = cachedItems.map((item) => {
    const text = (item.patternSummary + ' ' + (item.rawContext || '')).toLowerCase()
    let matches = 0
    for (const term of queryTerms) {
      if (text.includes(term)) matches++
    }
    const score = queryTerms.length > 0 ? 0.5 + 0.45 * (matches / queryTerms.length) : 0.65
    return {
      id: item.id,
      skill_id: item.skillId,
      vulnerability_id: item.vulnerabilityId,
      pattern_summary: item.patternSummary,
      similarity: Number(score.toFixed(4)),
      metadata: (item.metadata as Record<string, unknown>) || {},
    }
  })

  return scored.filter((s) => s.similarity >= threshold).slice(0, limit)
}
