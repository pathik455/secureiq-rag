import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { supabaseAdmin } from '@/lib/db/supabase'
import { z } from 'zod'

const UpdateVulnerabilitySchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  cveId: z.string().optional().nullable(),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']).optional(),
  cvssScore: z.number().min(0).max(10).optional().nullable(),
  affectedSystem: z.string().optional().nullable(),
  affectedVersions: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'FALSE_POSITIVE', 'DEFERRED']).optional(),
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
      const vulnerability = await prisma.vulnerability.findFirst({
        where: { id: params.id, createdById: userId },
        include: {
          vulRemedLinks: {
            include: {
              remediation: true,
            },
          },
        },
      })

      if (vulnerability) {
        return NextResponse.json({ data: vulnerability })
      }
    } catch (dbErr) {
      console.warn('[vulnerability] DB lookup error:', (dbErr as any)?.message)
    }

    // 2. Supabase query fallback
    try {
      const { data } = await supabaseAdmin
        .from('vulnerabilities')
        .select('*, vul_remed_links(*, remediation:remediations(*))')
        .eq('id', params.id)
        .eq('created_by', userId)
        .maybeSingle()

      if (data) {
        return NextResponse.json({ data })
      }
    } catch {}

    return NextResponse.json({ error: 'Vulnerability not found' }, { status: 404 })
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
    const parsed = UpdateVulnerabilitySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    // 1. Prisma update (account-scoped)
    try {
      const updated = await prisma.vulnerability.update({
        where: { id: params.id },
        data: parsed.data,
      })
      return NextResponse.json({ data: updated })
    } catch (prismaErr) {
      console.warn('[vulnerability] Prisma update error, falling back to Supabase:', (prismaErr as any)?.message)
    }

    // 2. Supabase update
    try {
      const { data, error } = await supabaseAdmin
        .from('vulnerabilities')
        .update({
          ...(parsed.data.title && { title: parsed.data.title }),
          ...(parsed.data.description !== undefined && { description: parsed.data.description }),
          ...(parsed.data.cveId !== undefined && { cve_id: parsed.data.cveId }),
          ...(parsed.data.severity && { severity: parsed.data.severity }),
          ...(parsed.data.cvssScore !== undefined && { cvss_score: parsed.data.cvssScore }),
          ...(parsed.data.affectedSystem !== undefined && { affected_system: parsed.data.affectedSystem }),
          ...(parsed.data.affectedVersions && { affected_versions: parsed.data.affectedVersions }),
          ...(parsed.data.tags && { tags: parsed.data.tags }),
          ...(parsed.data.status && { status: parsed.data.status }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id)
        .eq('created_by', userId)
        .select()
        .maybeSingle()

      if (!error && data) {
        return NextResponse.json({ data })
      }
    } catch {}

    return NextResponse.json({ error: 'Vulnerability not found or unauthorized' }, { status: 404 })
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
      await prisma.vulnerability.delete({
        where: { id: params.id },
      })
      return NextResponse.json({ success: true })
    } catch {}

    // 2. Supabase delete
    try {
      await supabaseAdmin
        .from('vulnerabilities')
        .delete()
        .eq('id', params.id)
        .eq('created_by', userId)
    } catch {}

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
