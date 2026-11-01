import { prisma } from '@/lib/db/prisma'
import { runHistoricalAnalyzer, Skill1Progress } from './skill1-historical'
import { runRemediationLinker, Skill2Progress } from './skill2-remediation'
import { AgentRunOptions, SSEMessage } from '@/types'

export async function* runAgentPipeline(
  options: AgentRunOptions = {},
  userId?: string
): AsyncGenerator<SSEMessage> {
  const batchSize = options.options?.batchSize || 50
  const confidenceThreshold = options.options?.confidenceThreshold || 0.7
  const dryRun = options.options?.dryRun || false

  let skills = await prisma.skill.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
  })

  // If DB hasn't been seeded yet, supply virtual definitions so test/demo works seamlessly
  if (skills.length === 0) {
    const historicalSkill = await prisma.skill.upsert({
      where: { name: 'Historical Vulnerability Analyzer' },
      create: {
        name: 'Historical Vulnerability Analyzer',
        description: 'Analyzes vulnerability history and extracts remediation patterns into vector cache',
        type: 'HISTORICAL_ANALYZER',
        version: '1.2.0',
        isActive: true,
      },
      update: {},
    })

    const linkerSkill = await prisma.skill.upsert({
      where: { name: 'Remediation Linker Agent' },
      create: {
        name: 'Remediation Linker Agent',
        description: 'Semantic vector search over cached patterns to propose and link remediation tasks',
        type: 'REMEDIATION_LINKER',
        version: '1.4.0',
        isActive: true,
      },
      update: {},
    })

    skills = [historicalSkill, linkerSkill]
  }

  const activeSkills = options.skillIds && options.skillIds.length > 0
    ? skills.filter((s) => options.skillIds!.includes(s.id) || options.skillIds!.includes(s.type))
    : skills

  yield {
    event: 'start',
    data: {
      totalSkills: activeSkills.length,
      message: `Initiating RAG pipeline with ${activeSkills.length} skill(s)`,
    },
  }

  let totalCache = 0
  let totalRemediations = 0
  let totalLinks = 0

  for (const skill of activeSkills) {
    yield {
      event: 'skill_start',
      data: {
        skillId: skill.id,
        name: skill.name,
        type: skill.type,
      },
    }

    if (skill.type === 'HISTORICAL_ANALYZER') {
      const queue: SSEMessage[] = []
      const res = await runHistoricalAnalyzer(
        skill.id,
        (p: Skill1Progress) => {
          queue.push({
            event: p.event as any,
            data: { skillId: skill.id, ...p },
          })
        },
        batchSize,
        null,
        userId
      )
      totalCache += res.cacheCreated

      for (const msg of queue) {
        yield msg
      }
    } else if (skill.type === 'REMEDIATION_LINKER') {
      const queue: SSEMessage[] = []
      const res = await runRemediationLinker(
        skill.id,
        (p: Skill2Progress) => {
          queue.push({
            event: p.event as any,
            data: { skillId: skill.id, ...p },
          })
        },
        confidenceThreshold,
        dryRun,
        userId
      )
      totalRemediations += res.remediationsCreated
      totalLinks += res.linksCreated

      for (const msg of queue) {
        yield msg
      }
    }

    await prisma.skill.update({
      where: { id: skill.id },
      data: { updatedAt: new Date() },
    })
  }

  yield {
    event: 'complete',
    data: {
      summary: {
        cacheEntries: totalCache,
        remediationsCreated: totalRemediations,
        linksCreated: totalLinks,
      },
      message: 'RAG Pipeline execution completed successfully.',
    },
  }
}
