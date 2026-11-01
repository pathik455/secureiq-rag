import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { supabaseAdmin } from '@/lib/db/supabase'

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
    const skillId = searchParams.get('skillId')

    // 1. Prisma query (account-scoped to user's vulnerabilities)
    try {
      const where: any = {
        vulnerability: { createdById: userId },
      }
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

      return NextResponse.json({
        data: cacheEntries,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      })
    } catch (dbErr) {
      console.warn('[cache] Prisma query failed, attempting Supabase client:', (dbErr as any)?.message)
    }

    // 2. Direct Supabase query fallback
    try {
      let query = supabaseAdmin
        .from('skill_cache')
        .select('*, vulnerability:vulnerabilities!inner(*), skill:skills(*)', { count: 'exact' })
        .eq('vulnerability.created_by', userId)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)

      if (skillId) query = query.eq('skill_id', skillId)

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
      console.warn('[cache] Supabase query fallback failed:', sbErr)
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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
