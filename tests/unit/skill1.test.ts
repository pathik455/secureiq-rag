import { runHistoricalAnalyzer } from '@/lib/agents/skill1-historical'

// Mock dependencies
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    vulnerability: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'test-vuln-1',
          title: 'Remote Code Execution in Ingress',
          cveId: 'CVE-2024-1111',
          severity: 'CRITICAL',
          cvssScore: 9.8,
          affectedSystem: 'ingress-gateway',
          description: 'Buffer overflow vulnerability in proxy parser',
          tags: ['rce', 'ingress'],
          status: 'RESOLVED',
          createdAt: new Date(),
        },
      ]),
    },
    skillCache: {
      upsert: jest.fn().mockResolvedValue({ id: 'cache-1' }),
    },
  },
}))

jest.mock('@/lib/rag/embeddings', () => ({
  createEmbedding: jest.fn().mockResolvedValue(new Array(1536).fill(0.01)),
}))

describe('Skill 1: Historical Vulnerability Analyzer', () => {
  it('analyzes vulnerabilities and emits progress events', async () => {
    const progressEvents: any[] = []

    const result = await runHistoricalAnalyzer(
      'skill-id-1',
      (p) => progressEvents.push(p),
      10
    )

    expect(result).toBeDefined()
    expect(result.cacheCreated).toBe(1)
    expect(progressEvents.length).toBeGreaterThan(0)
    expect(progressEvents[progressEvents.length - 1].event).toBe('skill_complete')
  })
})
