import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const UpdateScheduleSchema = z.object({
  name: z.string().min(1).optional(),
  cronExpression: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
})

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = UpdateScheduleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const schedule = await prisma.schedule.update({
      where: { id: params.id },
      data: parsed.data,
      include: { skill: true },
    })

    return NextResponse.json({ data: schedule })
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

    await prisma.schedule.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true, message: 'Deleted successfully' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
