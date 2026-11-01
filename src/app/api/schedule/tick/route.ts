import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { runHistoricalAnalyzer } from '@/lib/agents/skill1-historical'
import { runRemediationLinker } from '@/lib/agents/skill2-remediation'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized cron token' }, { status: 401 })
  }

  const now = new Date()
  const schedules = await prisma.schedule.findMany({
    where: { isActive: true },
    include: { skill: true },
  })

  const results: any[] = []

  for (const schedule of schedules) {
    const startTime = Date.now()
    let status: 'SUCCESS' | 'FAILED' = 'SUCCESS'
    let message = ''

    try {
      if (schedule.skill.type === 'HISTORICAL_ANALYZER') {
        const res = await runHistoricalAnalyzer(
          schedule.skillId,
          () => {},
          30,
          null,
          schedule.createdById || undefined
        )
        message = `Cached ${res.cacheCreated} vulnerability patterns`
      } else if (schedule.skill.type === 'REMEDIATION_LINKER') {
        const res = await runRemediationLinker(
          schedule.skillId,
          () => {},
          0.7,
          false,
          schedule.createdById || undefined
        )
        message = `Generated ${res.remediationsCreated} remediations and ${res.linksCreated} links`
      }
    } catch (err: any) {
      status = 'FAILED'
      message = err?.message || 'Error occurred during run'
    }

    const durationMs = Date.now() - startTime
    const runHistoryItem = {
      status,
      timestamp: now.toISOString(),
      durationMs,
      message,
    }

    const updatedHistory = [
      runHistoryItem,
      ...((schedule.runHistory as any[]) || []),
    ].slice(0, 10)

    await prisma.schedule.update({
      where: { id: schedule.id },
      data: {
        lastRunAt: now,
        lastRunStatus: status,
        runHistory: updatedHistory,
      },
    })

    results.push({ scheduleId: schedule.id, name: schedule.name, status, message })
  }

  return NextResponse.json({
    triggeredCount: results.length,
    results,
    timestamp: now.toISOString(),
  })
}
