import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { supabaseAdmin } from '@/lib/db/supabase'
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
      const skills = await prisma.skill.findMany({
        orderBy: { createdAt: 'asc' },
        include: {
          _count: {
            select: { skillCaches: true, schedules: true },
          },
        },
      })
      if (skills.length > 0) {
        return NextResponse.json({ data: skills })
      }
    } catch (dbErr) {
      console.warn('Skills Prisma query error:', dbErr)
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('skills')
        .select('*')
        .order('created_at', { ascending: true })

      if (!error && data) {
        return NextResponse.json({ data })
      }
    } catch (sbErr) {
      console.warn('Skills Supabase fallback error:', sbErr)
    }

    return NextResponse.json({ data: [] })
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
    } catch (dbErr: any) {
      const { data, error } = await supabaseAdmin
        .from('skills')
        .insert({
          name: parsed.data.name,
          description: parsed.data.description,
          type: parsed.data.type,
          prompt: parsed.data.prompt,
          version: parsed.data.version,
          is_active: parsed.data.isActive,
          config: parsed.data.config,
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ data }, { status: 201 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}
