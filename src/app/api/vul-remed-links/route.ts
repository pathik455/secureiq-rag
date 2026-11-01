import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { supabaseAdmin } from '@/lib/db/supabase'
import { z } from 'zod'

const CreateLinkSchema = z.object({
  vulnerabilityId: z.string().uuid(),
  remediationId: z.string().uuid(),
  linkType: z.enum(['MANUAL', 'AI_GENERATED', 'IMPORTED']).default('MANUAL'),
  confidenceScore: z.number().min(0).max(1).optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { searchParams } = new URL(req.url)
    const vulnerabilityId = searchParams.get('vulnerabilityId')
    const remediationId = searchParams.get('remediationId')

    // 1. Prisma query (account-scoped)
    try {
      const where: any = {
        vulnerability: { createdById: userId },
      }
      if (vulnerabilityId) where.vulnerabilityId = vulnerabilityId
      if (remediationId) where.remediationId = remediationId

      const links = await prisma.vulRemedLink.findMany({
        where,
        include: {
          vulnerability: true,
          remediation: true,
        },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json({ data: links })
    } catch (dbErr) {
      console.warn('[vul-remed-links] Prisma query failed, attempting Supabase client:', (dbErr as any)?.message)
    }

    // 2. Supabase query fallback
    try {
      let query = supabaseAdmin
        .from('vul_remed_links')
        .select('*, vulnerability:vulnerabilities!inner(*), remediation:remediations(*)')
        .eq('vulnerability.created_by', userId)
        .order('created_at', { ascending: false })

      if (vulnerabilityId) query = query.eq('vulnerability_id', vulnerabilityId)
      if (remediationId) query = query.eq('remediation_id', remediationId)

      const { data, error } = await query
      if (!error && data) {
        return NextResponse.json({ data })
      }
    } catch (sbErr) {
      console.warn('[vul-remed-links] Supabase query fallback failed:', sbErr)
    }

    return NextResponse.json({ data: [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = CreateLinkSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    // 1. Prisma write
    try {
      const link = await prisma.vulRemedLink.create({
        data: parsed.data,
        include: {
          vulnerability: true,
          remediation: true,
        },
      })

      return NextResponse.json({ data: link }, { status: 201 })
    } catch (prismaErr) {
      console.warn('[vul-remed-links] Prisma insert failed, falling back to Supabase client:', (prismaErr as any)?.message)
    }

    // 2. Supabase direct write
    try {
      const { data, error } = await supabaseAdmin
        .from('vul_remed_links')
        .insert({
          vulnerability_id: parsed.data.vulnerabilityId,
          remediation_id: parsed.data.remediationId,
          link_type: parsed.data.linkType,
          confidence_score: parsed.data.confidenceScore,
          notes: parsed.data.notes,
        })
        .select('*, vulnerability:vulnerabilities(*), remediation:remediations(*)')
        .single()

      if (!error && data) {
        return NextResponse.json({ data }, { status: 201 })
      }
      if (error) throw error
    } catch (sbErr: any) {
      return NextResponse.json({ error: sbErr.message || 'Failed to save link' }, { status: 500 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
