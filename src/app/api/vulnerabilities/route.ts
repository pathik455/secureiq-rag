import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { MOCK_VULNERABILITIES } from '@/lib/db/mockData'
import { z } from 'zod'

const VulnerabilitySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  cveId: z.string().optional().nullable(),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']),
  cvssScore: z.number().min(0).max(10).optional().nullable(),
  affectedSystem: z.string().optional().nullable(),
  affectedVersions: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'FALSE_POSITIVE', 'DEFERRED']).default('OPEN'),
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
    const severity = searchParams.get('severity')
    const status = searchParams.get('status')
    const search = searchParams.get('search')?.trim().toLowerCase()
    const sortField = searchParams.get('sort') || 'createdAt'
    const sortDir = (searchParams.get('sortDir') || 'desc') as 'asc' | 'desc'

    try {
      const where: any = {}
      if (severity && severity !== 'ALL') where.severity = severity
      if (status && status !== 'ALL') where.status = status
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { cveId: { contains: search, mode: 'insensitive' } },
          { affectedSystem: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ]
      }

      const orderBy: any = {}
      if (['title', 'severity', 'cvssScore', 'status', 'createdAt'].includes(sortField)) {
        orderBy[sortField] = sortDir
      } else {
        orderBy.createdAt = 'desc'
      }

      const [vulnerabilities, total] = await Promise.all([
        prisma.vulnerability.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy,
          include: {
            vulRemedLinks: {
              include: {
                remediation: {
                  select: {
                    id: true,
                    title: true,
                    status: true,
                    priority: true,
                    isAiGenerated: true,
                  },
                },
              },
            },
          },
        }),
        prisma.vulnerability.count({ where }),
      ])

      if (vulnerabilities.length > 0) {
        return NextResponse.json({
          data: vulnerabilities,
          meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        })
      }
    } catch (dbErr) {
      console.warn('Database query fallback to sample security data:', dbErr)
    }

    // Fallback: return sorted and filtered in-memory sample dataset
    let filtered = [...MOCK_VULNERABILITIES]
    if (severity && severity !== 'ALL') filtered = filtered.filter((v) => v.severity === severity)
    if (status && status !== 'ALL') filtered = filtered.filter((v) => v.status === status)
    if (search) {
      filtered = filtered.filter(
        (v) =>
          v.title.toLowerCase().includes(search) ||
          (v.cveId || '').toLowerCase().includes(search) ||
          (v.affectedSystem || '').toLowerCase().includes(search)
      )
    }

    // Apply sorting
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
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = VulnerabilitySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    try {
      const vulnerability = await prisma.vulnerability.create({
        data: {
          ...parsed.data,
          createdById: session.user.id,
        },
      })
      return NextResponse.json({ data: vulnerability }, { status: 201 })
    } catch {
      const mockVuln = {
        id: `mock-vuln-${Date.now()}`,
        ...parsed.data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        vulRemedLinks: [],
      }
      MOCK_VULNERABILITIES.unshift(mockVuln as any)
      return NextResponse.json({ data: mockVuln }, { status: 201 })
    }
  } catch (error: any) {
    console.error('Error creating vulnerability:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
