import { runRemediationLinker } from '@/lib/agents/skill2-remediation'

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    vulnerability: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'vuln-open-1',
          title: 'Unauthenticated SQL Injection in Billing',
          cveId: 'CVE-2024-9999',
          severity: 'CRITICAL',
          affectedSystem: 'billing-db',
          description: 'SQL injection via unescaped invoice ID parameter',
          tags: ['sqli', 'database'],
          status: 'OPEN',
          vulRemedLinks: [],
        },
      ]),
    },
    remediation: {
      create: jest.fn().mockResolvedValue({
        id: 'rem-new-1',
        title: 'Apply Parameterized Query Mitigation',
      }),
    },
    vulRemedLink: {
      upsert: jest.fn().mockResolvedValue({ id: 'link-1' }),
    },
  },
}))

jest.mock('@/lib/rag/vectorSearch', () => ({
  semanticSearch: jest.fn().mockResolvedValue([
    {
      id: 'cache-pattern-1',
      pattern_summary: 'SQL injection mitigated via parameterized prepared statements',
      similarity: 0.92,
    },
  ]),
}))

describe('Skill 2: Remediation Linker Agent', () => {
  it('identifies semantic patterns and creates remediation links', async () => {
    const progressEvents: any[] = []

    const result = await runRemediationLinker(
      'skill-id-2',
      (p) => progressEvents.push(p),
      0.7,
      false
    )

    expect(result).toBeDefined()
    expect(result.remediationsCreated).toBe(1)
    expect(result.linksCreated).toBe(1)
    expect(progressEvents[progressEvents.length - 1].event).toBe('skill_complete')
  })
})
