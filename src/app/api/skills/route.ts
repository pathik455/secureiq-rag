import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { MOCK_SKILLS } from '@/lib/db/mockData'
import { z } from 'zod'

const CreateSkillSchema = z.object({
  name: z.string().min(1, 'Skill name is required'),
  description: z.string().optional().nullable(),
  type: z.enum([
    'HISTORICAL_ANALYZER',
    'REMEDIATION_LINKER',
    'VULNERABILITY_REMEDIATION',
    'DOCUMENT_ANALYSIS',
    'CUSTOM',
  ]).default('VULNERABILITY_REMEDIATION'),
  prompt: z.string().optional().nullable(),
  version: z.string().default('1.0.0'),
  isActive: z.boolean().default(true),
  config: z.record(z.any()).default({}),
})

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      let skills = await prisma.skill.findMany({
        orderBy: { createdAt: 'asc' },
        include: {
          _count: {
            select: { skillCaches: true, schedules: true },
          },
        },
      })

      // Auto-seed predefined skills if table is empty
      if (skills.length === 0) {
        for (const mock of MOCK_SKILLS) {
          try {
            await prisma.skill.create({
              data: {
                name: mock.name,
                description: mock.description,
                type: mock.type as any,
                prompt: mock.prompt,
                version: mock.version,
                isActive: mock.isActive,
              },
            })
          } catch (seedErr) {
            // Skill might already exist
          }
        }

        skills = await prisma.skill.findMany({
          orderBy: { createdAt: 'asc' },
          include: {
            _count: {
              select: { skillCaches: true, schedules: true },
            },
          },
        })
      }

      if (skills.length > 0) {
        return NextResponse.json({ data: skills })
      }
    } catch (dbErr) {
      console.warn('Skills DB fallback to MOCK_SKILLS:', dbErr)
    }

    return NextResponse.json({ data: MOCK_SKILLS })
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
    const parsed = CreateSkillSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    try {
      const skill = await prisma.skill.create({
        data: parsed.data,
      })
      return NextResponse.json({ data: skill }, { status: 201 })
    } catch (dbErr) {
      // In-memory mock fallback
      const mockSkill = {
        id: `custom-skill-${Date.now()}`,
        ...parsed.data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _count: { skillCaches: 0, schedules: 0 },
      }
      MOCK_SKILLS.push(mockSkill as any)
      return NextResponse.json({ data: mockSkill }, { status: 201 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}
