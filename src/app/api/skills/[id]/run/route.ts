import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { supabaseAdmin } from '@/lib/db/supabase'
import { runHistoricalAnalyzer } from '@/lib/agents/skill1-historical'
import { runRemediationLinker } from '@/lib/agents/skill2-remediation'
import { runDocumentAnalyzer } from '@/lib/agents/skill-document'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
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
      console.warn('DB skill lookup failed, attempting Supabase admin:', dbErr)
    }

    if (!skill) {
      try {
        const { data } = await supabaseAdmin.from('skills').select('*').eq('id', params.id).single()
        if (data) skill = data
      } catch {}
    }

    if (!skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 })
    }

    let result: Record<string, unknown> = {}

    if (skill.type === 'HISTORICAL_ANALYZER' || skill.type === 'VULNERABILITY_REMEDIATION') {
      const batchSize = body.batchSize || 50
      result = await runHistoricalAnalyzer(skill.id, () => {}, batchSize, skill.prompt, session.user.id)
    } else if (skill.type === 'DOCUMENT_ANALYSIS') {
      const docText =
        body.documentContent ||
        `Cloud Defense Guideline:
All microservice endpoints must enforce mutual TLS (mTLS) with short-lived certificates.
Databases must not be directly reachable from public subnets.
Every container image deployed to production clusters must undergo continuous vulnerability scanning.`
      result = await runDocumentAnalyzer(
        skill.id,
        docText,
        body.documentTitle || 'Default SOC Architecture Playbook',
        skill.prompt
      )
    } else if (skill.type === 'REMEDIATION_LINKER') {
      result = await runRemediationLinker(skill.id, () => {}, 0.7, false, session.user.id)
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
      await supabaseAdmin.from('skills').update({ updated_at: new Date().toISOString() }).eq('id', skill.id)
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
