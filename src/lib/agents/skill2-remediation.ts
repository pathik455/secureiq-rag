import { prisma } from '@/lib/db/prisma'
import { semanticSearch } from '@/lib/rag/vectorSearch'
import OpenAI from 'openai'

function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('sk-your-')) {
    return null
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

export interface Skill2Progress {
  event: 'progress' | 'skill_complete' | 'error'
  processed?: number
  total?: number
  remediationsCreated?: number
  linksCreated?: number
  duration?: number
  error?: string
}

export async function runRemediationLinker(
  skillId: string,
  onProgress: (progress: Skill2Progress) => void,
  confidenceThreshold = 0.7,
  dryRun = false
): Promise<{ remediationsCreated: number; linksCreated: number; duration: number }> {
  const startTime = Date.now()
  const openai = getOpenAIClient()

  const openVulns = await prisma.vulnerability.findMany({
    where: {
      status: { in: ['OPEN', 'IN_PROGRESS'] },
    },
    take: 20,
    orderBy: { severity: 'asc' },
  })

  const total = openVulns.length
  let remediationsCreated = 0
  let linksCreated = 0

  for (let i = 0; i < openVulns.length; i++) {
    const vuln = openVulns[i]

    try {
      const searchQuery = `${vuln.title} ${vuln.description || ''} ${vuln.affectedSystem || ''} ${vuln.tags.join(' ')}`
      const matches = await semanticSearch(searchQuery, confidenceThreshold, 3)

      if (matches.length > 0) {
        const topMatch = matches[0]

        let remediationData = {
          title: `Apply Security Fix for ${vuln.title}`,
          description: `Implement hardening and remediation patch based on pattern analysis: "${topMatch.pattern_summary.slice(0, 180)}..."`,
          priority: vuln.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        }

        if (openai) {
          try {
            const prompt = `Based on the vulnerability and historical remediation pattern below, generate a practical security remediation task in JSON:
Vulnerability: ${vuln.title} (${vuln.cveId || 'No CVE'})
Severity: ${vuln.severity}
System: ${vuln.affectedSystem || 'Internal stack'}
Pattern: ${topMatch.pattern_summary}

Respond ONLY with valid JSON:
{"title": "Concise action-oriented remediation title", "description": "Step-by-step mitigation details", "priority": "CRITICAL|HIGH|MEDIUM|LOW"}`

            const res = await openai.chat.completions.create({
              model: 'gpt-4o-mini',
              messages: [{ role: 'user', content: prompt }],
              response_format: { type: 'json_object' },
            })
            const parsed = JSON.parse(res.choices[0]?.message?.content || '{}')
            if (parsed.title) remediationData = parsed
          } catch (e) {
            // fallback to default template
          }
        }

        if (!dryRun) {
          const remediation = await prisma.remediation.create({
            data: {
              title: remediationData.title,
              description: remediationData.description,
              priority: (remediationData.priority as any) || 'HIGH',
              status: 'PENDING',
              isAiGenerated: true,
              cacheId: topMatch.id,
            },
          })
          remediationsCreated++

          // Link vulnerability and remediation
          await prisma.vulRemedLink.upsert({
            where: {
              vulnerabilityId_remediationId: {
                vulnerabilityId: vuln.id,
                remediationId: remediation.id,
              },
            },
            create: {
              vulnerabilityId: vuln.id,
              remediationId: remediation.id,
              linkType: 'AI_GENERATED',
              confidenceScore: topMatch.similarity,
              createdByAgent: 'Skill 2: Remediation Linker',
              notes: `Auto-linked via RAG pattern match with ${(topMatch.similarity * 100).toFixed(1)}% confidence score.`,
            },
            update: {
              confidenceScore: topMatch.similarity,
            },
          })
          linksCreated++
        }
      }
    } catch (err: any) {
      console.error(`Skill2 error on vuln ${vuln.id}:`, err?.message || err)
    }

    if ((i + 1) % 5 === 0 || i === total - 1) {
      onProgress({
        event: 'progress',
        processed: i + 1,
        total,
        remediationsCreated,
        linksCreated,
      })
    }
  }

  const duration = Date.now() - startTime
  onProgress({
    event: 'skill_complete',
    remediationsCreated,
    linksCreated,
    duration,
  })

  return { remediationsCreated, linksCreated, duration }
}
