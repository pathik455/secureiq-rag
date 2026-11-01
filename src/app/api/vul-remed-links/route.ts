import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
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
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const vulnerabilityId = searchParams.get('vulnerabilityId')
    const remediationId = searchParams.get('remediationId')

    const where: any = {}
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = CreateLinkSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const link = await prisma.vulRemedLink.create({
      data: parsed.data,
      include: {
        vulnerability: true,
        remediation: true,
      },
    })

    return NextResponse.json({ data: link }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
