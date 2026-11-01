import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { supabaseAdmin } from '@/lib/db/supabase'
import { z } from 'zod'

const UpdateScheduleSchema = z.object({
  name: z.string().min(1).optional(),
  cronExpression: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
})

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await req.json()
    const parsed = UpdateScheduleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    // 1. Prisma update
    try {
      const schedule = await prisma.schedule.update({
        where: { id: params.id },
        data: parsed.data,
        include: { skill: true },
      })
      return NextResponse.json({ data: schedule })
    } catch (prismaErr) {
      console.warn('[schedule] Prisma update error, falling back to Supabase:', (prismaErr as any)?.message)
    }

    // 2. Supabase update
    try {
      const { data, error } = await supabaseAdmin
        .from('schedules')
        .update({
          ...(parsed.data.name && { name: parsed.data.name }),
          ...(parsed.data.cronExpression && { cron_expression: parsed.data.cronExpression }),
          ...(parsed.data.isActive !== undefined && { is_active: parsed.data.isActive }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id)
        .eq('created_by', userId)
        .select('*, skill:skills(*)')
        .maybeSingle()

      if (!error && data) {
        return NextResponse.json({ data })
      }
    } catch {}

    return NextResponse.json({ error: 'Schedule not found or unauthorized' }, { status: 404 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // 1. Prisma delete
    try {
      await prisma.schedule.delete({
        where: { id: params.id },
      })
      return NextResponse.json({ success: true, message: 'Deleted successfully' })
    } catch {}

    // 2. Supabase delete
    try {
      await supabaseAdmin
        .from('schedules')
        .delete()
        .eq('id', params.id)
        .eq('created_by', userId)
    } catch {}

    return NextResponse.json({ success: true, message: 'Deleted successfully' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
