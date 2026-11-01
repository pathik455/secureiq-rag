import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { supabaseAdmin } from '@/lib/db/supabase'
import { z } from 'zod'

const RemediationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DEFERRED']).default('PENDING'),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  dueDate: z.string().optional().nullable(),
  resolutionNotes: z.string().optional().nullable(),
  isAiGenerated: z.boolean().default(false),
  vulnerabilityId: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const search = searchParams.get('search')?.trim().toLowerCase()
    const sortField = searchParams.get('sort') || 'createdAt'
    const sortDir = (searchParams.get('sortDir') || 'desc') as 'asc' | 'desc'

    // 1. Prisma query (account-scoped)
    try {
      const where: any = {
        OR: [{ createdById: userId }, { assignedToId: userId }],
      }
      if (status && status !== 'ALL') where.status = status
      if (priority && priority !== 'ALL') where.priority = priority
      if (search) {
        where.AND = [
          {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
              { resolutionNotes: { contains: search, mode: 'insensitive' } },
            ],
          },
        ]
      }

      const orderBy: any = {}
      if (['title', 'status', 'priority', 'dueDate', 'createdAt'].includes(sortField)) {
        orderBy[sortField] = sortDir
      } else {
        orderBy.createdAt = 'desc'
      }

      const [remediations, total] = await Promise.all([
        prisma.remediation.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy,
          include: {
            vulRemedLinks: {
              include: {
                vulnerability: {
                  select: {
                    id: true,
                    title: true,
                    cveId: true,
                    severity: true,
                    status: true,
                  },
                },
              },
            },
          },
        }),
        prisma.remediation.count({ where }),
      ])

      return NextResponse.json({
        data: remediations,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      })
    } catch (dbErr) {
      console.warn('[remediations] Prisma query failed, attempting Supabase client:', (dbErr as any)?.message)
    }

    // 2. Direct Supabase query fallback (account-specific)
    try {
      let query = supabaseAdmin
        .from('remediations')
        .select('*, vul_remed_links(*, vulnerability:vulnerabilities(*))', { count: 'exact' })
        .or(`created_by.eq.${userId},assigned_to.eq.${userId}`)

      if (status && status !== 'ALL') query = query.eq('status', status)
      if (priority && priority !== 'ALL') query = query.eq('priority', priority)
      if (search) query = query.ilike('title', `%${search}%`)

      const sortCol = sortField === 'createdAt' ? 'created_at' : sortField
      query = query.order(sortCol, { ascending: sortDir === 'asc' })
      query = query.range((page - 1) * limit, page * limit - 1)

      const { data, count, error } = await query
      if (!error && data) {
        return NextResponse.json({
          data,
          meta: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit) || 1,
          },
        })
      }
    } catch (sbErr) {
      console.warn('[remediations] Supabase query fallback failed:', sbErr)
    }

    // Return empty dataset (NO sample data)
    return NextResponse.json({
      data: [],
      meta: {
        page: 1,
        limit,
        total: 0,
        totalPages: 1,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
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
    const parsed = RemediationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { vulnerabilityId, dueDate, ...data } = parsed.data

    // 1. Prisma write
    try {
      const remediation = await prisma.remediation.create({
        data: {
          ...data,
          dueDate: dueDate ? new Date(dueDate) : null,
          createdById: userId,
        },
      })

      if (vulnerabilityId) {
        await prisma.vulRemedLink.create({
          data: {
            vulnerabilityId,
            remediationId: remediation.id,
            linkType: 'MANUAL',
            notes: 'Manually linked during remediation creation',
          },
        })
      }

      return NextResponse.json({ data: remediation }, { status: 201 })
    } catch (prismaErr) {
      console.warn('[remediations] Prisma insert failed, falling back to Supabase client:', (prismaErr as any)?.message)
    }

    // 2. Supabase direct write
    try {
      const { data: rem, error } = await supabaseAdmin
        .from('remediations')
        .insert({
          title: data.title,
          description: data.description,
          status: data.status,
          priority: data.priority,
          due_date: dueDate ? new Date(dueDate).toISOString() : null,
          resolution_notes: data.resolutionNotes,
          is_ai_generated: data.isAiGenerated,
          created_by: userId,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (!error && rem) {
        if (vulnerabilityId) {
          await supabaseAdmin.from('vul_remed_links').insert({
            vulnerability_id: vulnerabilityId,
            remediation_id: rem.id,
            link_type: 'MANUAL',
            notes: 'Manually linked during remediation creation',
          })
        }
        return NextResponse.json({ data: rem }, { status: 201 })
      }
      if (error) throw error
    } catch (sbErr: any) {
      console.error('[remediations] Supabase insert error:', sbErr)
      return NextResponse.json({ error: sbErr.message || 'Failed to save remediation' }, { status: 500 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create remediation' }, { status: 500 })
  }
}
