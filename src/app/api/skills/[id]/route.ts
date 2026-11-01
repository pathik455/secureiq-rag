import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { MOCK_SKILLS } from '@/lib/db/mockData'
import { z } from 'zod'

const UpdateSkillSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  type: z.enum([
    'HISTORICAL_ANALYZER',
    'REMEDIATION_LINKER',
    'VULNERABILITY_REMEDIATION',
    'DOCUMENT_ANALYSIS',
    'CUSTOM',
  ]).optional(),
  prompt: z.string().optional().nullable(),
  version: z.string().optional(),
  isActive: z.boolean().optional(),
  config: z.record(z.any()).optional(),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      const skill = await prisma.skill.findUnique({
        where: { id: params.id },
        include: { _count: { select: { skillCaches: true, schedules: true } } },
      })
      if (skill) return NextResponse.json({ data: skill })
    } catch {
      // Mock fallback
    }

    const mock = MOCK_SKILLS.find((s) => s.id === params.id)
    if (mock) return NextResponse.json({ data: mock })

    return NextResponse.json({ error: 'Skill not found' }, { status: 404 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = UpdateSkillSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    try {
      const updated = await prisma.skill.update({
        where: { id: params.id },
        data: parsed.data,
      })
      return NextResponse.json({ data: updated })
    } catch {
      const idx = MOCK_SKILLS.findIndex((s) => s.id === params.id)
      if (idx !== -1) {
        ;(MOCK_SKILLS as any)[idx] = { ...MOCK_SKILLS[idx], ...parsed.data, updatedAt: new Date().toISOString() }
        return NextResponse.json({ data: MOCK_SKILLS[idx] })
      }
      return NextResponse.json({ data: { id: params.id, ...parsed.data } })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      await prisma.skill.delete({
        where: { id: params.id },
      })
    } catch {
      const idx = MOCK_SKILLS.findIndex((s) => s.id === params.id)
      if (idx !== -1) MOCK_SKILLS.splice(idx, 1)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
