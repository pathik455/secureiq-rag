import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { supabaseAdmin } from '@/lib/db/supabase'
import { z } from 'zod'

const ScheduleSchema = z.object({
  skillId: z.string().uuid(),
  name: z.string().min(1, 'Schedule name is required'),
  cronExpression: z.string().min(1, 'Cron expression is required'),
  isActive: z.boolean().default(true),
})

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // 1. Prisma query (account-scoped)
    try {
      const schedules = await prisma.schedule.findMany({
        where: { createdById: userId },
        orderBy: { createdAt: 'desc' },
        include: {
          skill: true,
        },
      })

      return NextResponse.json({ data: schedules })
    } catch (dbErr) {
      console.warn('[schedules] Prisma query failed, attempting Supabase client:', (dbErr as any)?.message)
    }

    // 2. Supabase query fallback
    try {
      const { data, error } = await supabaseAdmin
        .from('schedules')
        .select('*, skill:skills(*)')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })

      if (!error && data) {
        return NextResponse.json({ data })
      }
    } catch (sbErr) {
      console.warn('[schedules] Supabase query fallback failed:', sbErr)
    }

    // Return empty dataset (NO sample data)
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

    const userId = session.user.id
    const body = await req.json()
    const parsed = ScheduleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    // 1. Prisma write
    try {
      const schedule = await prisma.schedule.create({
        data: {
          ...parsed.data,
          createdById: userId,
        },
        include: {
          skill: true,
        },
      })
      return NextResponse.json({ data: schedule }, { status: 201 })
    } catch (prismaErr) {
      console.warn('[schedules] Prisma insert failed, falling back to Supabase client:', (prismaErr as any)?.message)
    }

    // 2. Supabase direct write
    try {
      const { data, error } = await supabaseAdmin
        .from('schedules')
        .insert({
          skill_id: parsed.data.skillId,
          name: parsed.data.name,
          cron_expression: parsed.data.cronExpression,
          is_active: parsed.data.isActive,
          created_by: userId,
          updated_at: new Date().toISOString(),
        })
        .select('*, skill:skills(*)')
        .single()

      if (!error && data) {
        return NextResponse.json({ data }, { status: 201 })
      }
      if (error) throw error
    } catch (sbErr: any) {
      console.error('[schedules] Supabase insert error:', sbErr)
      return NextResponse.json({ error: sbErr.message || 'Failed to save schedule' }, { status: 500 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
