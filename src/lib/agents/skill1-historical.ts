import { prisma } from '@/lib/db/prisma'
import { createEmbedding } from '@/lib/rag/embeddings'
import OpenAI from 'openai'

function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('sk-your-')) {
    return null
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

export interface Skill1Progress {
  event: 'progress' | 'batch_complete' | 'skill_complete' | 'error'
  processed?: number
  total?: number
  cacheCreated?: number
  duration?: number
  batchNumber?: number
  totalBatches?: number
  error?: string
}

/**
 * Runs historical vulnerability analysis with robust batching.
 * Vulnerabilities are chunked into batches (e.g. 50 per batch) to handle thousands of
 * security tickets without memory exhaustion or LLM context window overflows.
 */
export async function runHistoricalAnalyzer(
  skillId: string,
  onProgress: (progress: Skill1Progress) => void,
  batchSize = 50,
  customPrompt?: string | null,
  userId?: string
): Promise<{ cacheCreated: number; duration: number; batchesProcessed: number }> {
  const startTime = Date.now()
  const openai = getOpenAIClient()

  // 1. Determine total vulnerabilities to process
  let total = 0
  const where = userId ? { createdById: userId } : {}
  try {
    if (typeof (prisma.vulnerability as any)?.count === 'function') {
      total = await prisma.vulnerability.count({ where })
    } else {
      const sample = await prisma.vulnerability.findMany({ where, take: 100 })
      total = sample.length
    }
  } catch {
    total = 0
  }

  if (total === 0) {
    onProgress({
      event: 'skill_complete',
      batchNumber: 0,
      totalBatches: 0,
      processed: 0,
      total: 0,
    })
    return { cacheCreated: 0, duration: Date.now() - startTime, batchesProcessed: 0 }
  }

  const totalBatches = Math.max(1, Math.ceil(total / batchSize))
  let cacheCreated = 0
  let processed = 0

  console.log(`[Batch Engine] Starting Historical Skill run for skill ${skillId}: total ${total} items across ${totalBatches} batches (batchSize=${batchSize})`)

  // 2. Iterate through batches
  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const offset = batchIndex * batchSize
    let vulnerabilities: any[] = []

    try {
      vulnerabilities = await prisma.vulnerability.findMany({
        where,
        skip: offset,
        take: batchSize,
        orderBy: { createdAt: 'desc' },
      })
    } catch (dbErr) {
      console.warn('[skill1] DB fetch failed:', dbErr)
      vulnerabilities = []
    }

    if (vulnerabilities.length === 0) break

    // Process vulnerabilities within current batch
    for (let i = 0; i < vulnerabilities.length; i++) {
      const vuln = vulnerabilities[i]

      try {
        let patternSummary = ''
        if (openai) {
          const userPrompt = customPrompt
            ? `${customPrompt}\n\nVulnerability Title: ${vuln.title}\nCVE: ${vuln.cveId || 'N/A'}\nSeverity: ${vuln.severity}\nCVSS: ${vuln.cvssScore ?? 'N/A'}\nSystem: ${vuln.affectedSystem ?? 'N/A'}\nDescription: ${vuln.description ?? 'None'}\nTags: ${(vuln.tags || []).join(', ')}`
            : `You are a security intelligence analyzer. Analyze this vulnerability and provide a structured 2-sentence pattern summary detailing root cause vector, affected stack, and remediation methodology:
Title: ${vuln.title}
CVE: ${vuln.cveId || 'N/A'}
Severity: ${vuln.severity}
CVSS: ${vuln.cvssScore ?? 'N/A'}
System: ${vuln.affectedSystem ?? 'N/A'}
Description: ${vuln.description ?? 'None'}
Tags: ${(vuln.tags || []).join(', ')}`

          const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: userPrompt }],
            max_tokens: 180,
          })
          patternSummary = completion.choices[0]?.message?.content?.trim() || ''
        }

        if (!patternSummary) {
          patternSummary = `Pattern for ${vuln.title}: Common attack vector in ${vuln.affectedSystem || 'core service'} classified under ${(vuln.tags || []).join(', ') || 'security'}. Recommended pattern involves validation gating, least-privilege enforcement, and patched upstream libraries.`
        }

        // Generate embedding vector
        await createEmbedding(patternSummary)

        // Upsert into SkillCache
        try {
          if (vuln.id && !vuln.id.startsWith('mock-')) {
            await prisma.skillCache.create({
              data: {
                skillId,
                vulnerabilityId: vuln.id,
                sourceType: 'VULNERABILITY',
                patternSummary,
                rawContext: JSON.stringify({
                  title: vuln.title,
                  severity: vuln.severity,
                  system: vuln.affectedSystem,
                  tags: vuln.tags,
                }),
                metadata: {
                  cveId: vuln.cveId,
                  severity: vuln.severity,
                  analyzedAt: new Date().toISOString(),
                  batchIndex,
                  batchSize,
                },
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              },
            })
          }
        } catch (cacheErr) {
          // Ignore duplicate constraint or fallback
        }

        cacheCreated++
      } catch (err: any) {
        console.error(`Skill1 error on item ${vuln.id}:`, err?.message || err)
      }

      processed++
      if ((i + 1) % 5 === 0 || i === vulnerabilities.length - 1) {
        onProgress({
          event: 'progress',
          processed,
          total,
          batchNumber: batchIndex + 1,
          totalBatches,
        })
      }
    }

    // Emit batch completion
    onProgress({
      event: 'batch_complete',
      batchNumber: batchIndex + 1,
      totalBatches,
      processed,
      total,
      cacheCreated,
    })

    // Jitter delay between batches to respect rate limits
    if (batchIndex < totalBatches - 1) {
      await new Promise((resolve) => setTimeout(resolve, 300))
    }
  }

  const duration = Date.now() - startTime
  onProgress({
    event: 'skill_complete',
    cacheCreated,
    duration,
    totalBatches,
  })

  return {
    cacheCreated,
    duration,
    batchesProcessed: totalBatches,
  }
}
