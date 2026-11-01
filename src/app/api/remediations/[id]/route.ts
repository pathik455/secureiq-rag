import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { MOCK_REMEDIATIONS } from '@/lib/db/mockData'
import { z } from 'zod'

const UpdateRemediationSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DEFERRED']).optional(),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  dueDate: z.string().optional().nullable(),
  resolutionNotes: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      const remediation = await prisma.remediation.findUnique({
        where: { id: params.id },
        include: {
          vulRemedLinks: {
            include: {
              vulnerability: true,
            },
          },
        },
      })

      if (remediation) {
        return NextResponse.json({ data: remediation })
      }
    } catch (dbErr) {
      console.warn('DB lookup failed, checking mockData:', dbErr)
    }

    const mock = MOCK_REMEDIATIONS.find((r) => r.id === params.id)
    if (mock) {
      return NextResponse.json({ data: mock })
    }

    return NextResponse.json({ error: 'Remediation not found' }, { status: 404 })
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
    const parsed = UpdateRemediationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { dueDate, ...data } = parsed.data

    try {
      const remediation = await prisma.remediation.update({
        where: { id: params.id },
        data: {
          ...data,
          ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
        },
      })
      return NextResponse.json({ data: remediation })
    } catch {
      const idx = MOCK_REMEDIATIONS.findIndex((r) => r.id === params.id)
      if (idx !== -1) {
        ;(MOCK_REMEDIATIONS as any)[idx] = { ...MOCK_REMEDIATIONS[idx], ...data }
        return NextResponse.json({ data: MOCK_REMEDIATIONS[idx] })
      }
      return NextResponse.json({ data: { id: params.id, ...data } })
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
      await prisma.remediation.delete({
        where: { id: params.id },
      })
    } catch {
      const idx = MOCK_REMEDIATIONS.findIndex((r) => r.id === params.id)
      if (idx !== -1) MOCK_REMEDIATIONS.splice(idx, 1)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
