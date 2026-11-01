import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { supabaseAdmin } from '@/lib/db/supabase'
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
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const severity = searchParams.get('severity')
    const status = searchParams.get('status')
    const search = searchParams.get('search')?.trim().toLowerCase()
    const sortField = searchParams.get('sort') || 'createdAt'
    const sortDir = (searchParams.get('sortDir') || 'desc') as 'asc' | 'desc'

    // 1. Try Prisma with strict user isolation
    try {
      const where: any = { createdById: userId }
      if (severity && severity !== 'ALL') where.severity = severity
      if (status && status !== 'ALL') where.status = status
      if (search) {
        where.AND = [
          {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { cveId: { contains: search, mode: 'insensitive' } },
              { affectedSystem: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          },
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

      return NextResponse.json({
        data: vulnerabilities,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      })
    } catch (dbErr) {
      console.warn('[vulnerabilities] Prisma query failed, attempting Supabase client:', (dbErr as any)?.message)
    }

    // 2. Direct Supabase query fallback (account-specific)
    try {
      let query = supabaseAdmin
        .from('vulnerabilities')
        .select('*, vul_remed_links(*, remediation:remediations(*))', { count: 'exact' })
        .eq('created_by', userId)

      if (severity && severity !== 'ALL') query = query.eq('severity', severity)
      if (status && status !== 'ALL') query = query.eq('status', status)
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
      console.warn('[vulnerabilities] Supabase query fallback failed:', sbErr)
    }

    // Return empty dataset for account (NO sample data)
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
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
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
    const parsed = VulnerabilitySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    // 1. Try Prisma write
    try {
      const vulnerability = await prisma.vulnerability.create({
        data: {
          ...parsed.data,
          createdById: userId,
        },
      })
      return NextResponse.json({ data: vulnerability }, { status: 201 })
    } catch (prismaErr) {
      console.warn('[vulnerabilities] Prisma insert failed, falling back to Supabase client:', (prismaErr as any)?.message)
    }

    // 2. Direct Supabase write
    try {
      const { data, error } = await supabaseAdmin
        .from('vulnerabilities')
        .insert({
          title: parsed.data.title,
          description: parsed.data.description,
          cve_id: parsed.data.cveId,
          severity: parsed.data.severity,
          cvss_score: parsed.data.cvssScore,
          affected_system: parsed.data.affectedSystem,
          affected_versions: parsed.data.affectedVersions,
          tags: parsed.data.tags,
          status: parsed.data.status,
          created_by: userId,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (!error && data) {
        return NextResponse.json({ data }, { status: 201 })
      }
      if (error) throw error
    } catch (sbErr: any) {
      console.error('[vulnerabilities] Supabase insert failed:', sbErr)
      return NextResponse.json({ error: sbErr.message || 'Failed to save vulnerability' }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Error creating vulnerability:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
