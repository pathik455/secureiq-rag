import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { supabaseAdmin } from '@/lib/db/supabase'
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
    } catch (dbErr) {
      console.warn('Prisma skill get error:', dbErr)
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('skills')
        .select('*')
        .eq('id', params.id)
        .single()
      if (!error && data) return NextResponse.json({ data })
    } catch {}

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
    } catch (dbErr) {
      const { data, error } = await supabaseAdmin
        .from('skills')
        .update({
          ...(parsed.data.name ? { name: parsed.data.name } : {}),
          ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
          ...(parsed.data.type ? { type: parsed.data.type } : {}),
          ...(parsed.data.prompt !== undefined ? { prompt: parsed.data.prompt } : {}),
          ...(parsed.data.version ? { version: parsed.data.version } : {}),
          ...(parsed.data.isActive !== undefined ? { is_active: parsed.data.isActive } : {}),
          ...(parsed.data.config ? { config: parsed.data.config } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ data })
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
      await supabaseAdmin.from('skills').delete().eq('id', params.id)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
