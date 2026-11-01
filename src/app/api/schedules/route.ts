import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { MOCK_SCHEDULES } from '@/lib/db/mockData'
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
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      const schedules = await prisma.schedule.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          skill: true,
        },
      })

      if (schedules.length > 0) {
        return NextResponse.json({ data: schedules })
      }
    } catch (dbErr) {
      console.warn('Schedules DB fallback:', dbErr)
    }

    return NextResponse.json({ data: MOCK_SCHEDULES })
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
    const parsed = ScheduleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const schedule = await prisma.schedule.create({
      data: {
        ...parsed.data,
        createdById: session.user.id,
      },
      include: {
        skill: true,
      },
    })

    return NextResponse.json({ data: schedule }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
