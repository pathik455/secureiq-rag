import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { supabaseAdmin } from '@/lib/db/supabase'
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
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // 1. Prisma query (account-scoped)
    try {
      const remediation = await prisma.remediation.findFirst({
        where: {
          id: params.id,
          OR: [{ createdById: userId }, { assignedToId: userId }],
        },
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
      console.warn('[remediation] DB lookup failed:', (dbErr as any)?.message)
    }

    // 2. Supabase query fallback
    try {
      const { data } = await supabaseAdmin
        .from('remediations')
        .select('*, vul_remed_links(*, vulnerability:vulnerabilities(*))')
        .eq('id', params.id)
        .or(`created_by.eq.${userId},assigned_to.eq.${userId}`)
        .maybeSingle()

      if (data) {
        return NextResponse.json({ data })
      }
    } catch {}

    return NextResponse.json({ error: 'Remediation not found' }, { status: 404 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await req.json()
    const parsed = UpdateRemediationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { dueDate, ...data } = parsed.data

    // 1. Prisma update
    try {
      const remediation = await prisma.remediation.update({
        where: { id: params.id },
        data: {
          ...data,
          ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
        },
      })
      return NextResponse.json({ data: remediation })
    } catch (prismaErr) {
      console.warn('[remediation] Prisma update error, falling back to Supabase:', (prismaErr as any)?.message)
    }

    // 2. Supabase update
    try {
      const { data: updated, error } = await supabaseAdmin
        .from('remediations')
        .update({
          ...(data.title && { title: data.title }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.status && { status: data.status }),
          ...(data.priority && { priority: data.priority }),
          ...(dueDate !== undefined ? { due_date: dueDate ? new Date(dueDate).toISOString() : null } : {}),
          ...(data.resolutionNotes !== undefined && { resolution_notes: data.resolutionNotes }),
          ...(data.assignedToId !== undefined && { assigned_to: data.assignedToId }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id)
        .eq('created_by', userId)
        .select()
        .maybeSingle()

      if (!error && updated) {
        return NextResponse.json({ data: updated })
      }
    } catch {}

    return NextResponse.json({ error: 'Remediation not found or unauthorized' }, { status: 404 })
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
      await prisma.remediation.delete({
        where: { id: params.id },
      })
      return NextResponse.json({ success: true })
    } catch {}

    // 2. Supabase delete
    try {
      await supabaseAdmin
        .from('remediations')
        .delete()
        .eq('id', params.id)
        .eq('created_by', userId)
    } catch {}

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
