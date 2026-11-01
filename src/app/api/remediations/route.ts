import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { MOCK_REMEDIATIONS } from '@/lib/db/mockData'
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
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const search = searchParams.get('search')?.trim().toLowerCase()
    const sortField = searchParams.get('sort') || 'createdAt'
    const sortDir = (searchParams.get('sortDir') || 'desc') as 'asc' | 'desc'

    try {
      const where: any = {}
      if (status && status !== 'ALL') where.status = status
      if (priority && priority !== 'ALL') where.priority = priority
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { resolutionNotes: { contains: search, mode: 'insensitive' } },
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

      if (remediations.length > 0) {
        return NextResponse.json({
          data: remediations,
          meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        })
      }
    } catch (dbErr) {
      console.warn('Remediations DB fallback:', dbErr)
    }

    let filtered = [...MOCK_REMEDIATIONS]
    if (status && status !== 'ALL') filtered = filtered.filter((r) => r.status === status)
    if (priority && priority !== 'ALL') filtered = filtered.filter((r) => r.priority === priority)
    if (search) {
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(search) ||
          (r.description || '').toLowerCase().includes(search)
      )
    }

    filtered.sort((a: any, b: any) => {
      let valA = a[sortField] ?? ''
      let valB = b[sortField] ?? ''
      if (typeof valA === 'string') valA = valA.toLowerCase()
      if (typeof valB === 'string') valB = valB.toLowerCase()

      if (valA < valB) return sortDir === 'asc' ? -1 : 1
      if (valA > valB) return sortDir === 'asc' ? 1 : -1
      return 0
    })

    const total = filtered.length
    const paginated = filtered.slice((page - 1) * limit, page * limit)

    return NextResponse.json({
      data: paginated,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = RemediationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { vulnerabilityId, dueDate, ...data } = parsed.data

    try {
      const remediation = await prisma.remediation.create({
        data: {
          ...data,
          dueDate: dueDate ? new Date(dueDate) : null,
          createdById: session.user.id,
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
    } catch {
      const mockRem = {
        id: `mock-rem-${Date.now()}`,
        ...data,
        dueDate: dueDate || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        vulRemedLinks: [],
      }
      MOCK_REMEDIATIONS.unshift(mockRem as any)
      return NextResponse.json({ data: mockRem }, { status: 201 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}
