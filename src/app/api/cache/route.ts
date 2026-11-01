import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { MOCK_CACHE } from '@/lib/db/mockData'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const skillId = searchParams.get('skillId')

    try {
      const where: any = {}
      if (skillId) where.skillId = skillId

      const [cacheEntries, total] = await Promise.all([
        prisma.skillCache.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            skill: { select: { id: true, name: true, type: true } },
            vulnerability: { select: { id: true, title: true, cveId: true, severity: true } },
            _count: { select: { remediations: true } },
          },
        }),
        prisma.skillCache.count({ where }),
      ])

      if (cacheEntries.length > 0) {
        return NextResponse.json({
          data: cacheEntries,
          meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        })
      }
    } catch (dbErr) {
      console.warn('Cache DB fallback:', dbErr)
    }

    return NextResponse.json({
      data: MOCK_CACHE,
      meta: {
        page: 1,
        limit,
        total: MOCK_CACHE.length,
        totalPages: 1,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
