import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { runHistoricalAnalyzer } from '@/lib/agents/skill1-historical'
import { runRemediationLinker } from '@/lib/agents/skill2-remediation'
import { runDocumentAnalyzer } from '@/lib/agents/skill-document'
import { MOCK_SKILLS } from '@/lib/db/mockData'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: any = {}
    try {
      body = await req.json()
    } catch {
      // Body may be empty
    }

    let skill: any = null
    try {
      skill = await prisma.skill.findUnique({
        where: { id: params.id },
      })
    } catch (dbErr) {
      console.warn('DB skill lookup failed, searching mockData:', dbErr)
    }

    if (!skill) {
      skill = MOCK_SKILLS.find((s) => s.id === params.id)
    }

    if (!skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 })
    }

    let result: Record<string, unknown> = {}

    if (skill.type === 'HISTORICAL_ANALYZER' || skill.type === 'VULNERABILITY_REMEDIATION') {
      const batchSize = body.batchSize || 50
      result = await runHistoricalAnalyzer(skill.id, () => {}, batchSize, skill.prompt)
    } else if (skill.type === 'DOCUMENT_ANALYSIS') {
      const docText =
        body.documentContent ||
        `edocode455 Cloud Defense Guideline:
All microservice endpoints must enforce mutual TLS (mTLS) with short-lived SPIFFE/SPIRE certificates.
Databases must not be directly reachable from public subnets.
Every container image deployed to production clusters must be signed via Cosign and undergo continuous Trivy vulnerability scanning.
Any critical vulnerability identified in container base layers must trigger an automated rollback or hotpatch within 24 hours.`
      result = await runDocumentAnalyzer(
        skill.id,
        docText,
        body.documentTitle || 'Default SOC Architecture Playbook',
        skill.prompt
      )
    } else if (skill.type === 'REMEDIATION_LINKER') {
      result = await runRemediationLinker(skill.id, () => {}, 0.7, false)
    } else {
      // Custom skill execution
      result = { executed: true, skillType: skill.type, message: 'Custom skill executed successfully' }
    }

    try {
      await prisma.skill.update({
        where: { id: skill.id },
        data: { updatedAt: new Date() },
      })
    } catch {
      // Mock update fallback
      const m = MOCK_SKILLS.find((s) => s.id === skill.id)
      if (m) m.updatedAt = new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: `Skill "${skill.name}" executed successfully!`,
    })
  } catch (error: any) {
    console.error('Skill run error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
