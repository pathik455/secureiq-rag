import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { MOCK_VULNERABILITIES } from '@/lib/db/mockData'
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
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      const vulnerability = await prisma.vulnerability.findUnique({
        where: { id: params.id },
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
      console.warn('DB lookup failed, checking mockData:', dbErr)
    }

    // Mock fallback
    const mock = MOCK_VULNERABILITIES.find((v) => v.id === params.id)
    if (mock) {
      return NextResponse.json({ data: mock })
    }

    return NextResponse.json({ error: 'Vulnerability not found' }, { status: 404 })
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
    const parsed = UpdateVulnerabilitySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    try {
      const updated = await prisma.vulnerability.update({
        where: { id: params.id },
        data: parsed.data,
      })
      return NextResponse.json({ data: updated })
    } catch {
      // Mock update fallback
      const mockIdx = MOCK_VULNERABILITIES.findIndex((v) => v.id === params.id)
      if (mockIdx !== -1) {
        ;(MOCK_VULNERABILITIES as any)[mockIdx] = { ...MOCK_VULNERABILITIES[mockIdx], ...parsed.data }
        return NextResponse.json({ data: MOCK_VULNERABILITIES[mockIdx] })
      }
      return NextResponse.json({ data: { id: params.id, ...parsed.data } })
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
      await prisma.vulnerability.delete({
        where: { id: params.id },
      })
    } catch {
      const idx = MOCK_VULNERABILITIES.findIndex((v) => v.id === params.id)
      if (idx !== -1) MOCK_VULNERABILITIES.splice(idx, 1)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
