import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { scanGitHubRepository } from '@/lib/scanner/github'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const ScanRequestSchema = z.object({
  repoUrl: z.string().min(1, 'Repository URL or owner/repo is required'),
  githubToken: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = ScanRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const result = await scanGitHubRepository(
      parsed.data.repoUrl,
      parsed.data.githubToken,
      session.user.id
    )

    return NextResponse.json({
      success: true,
      data: result,
      message: `Scanned ${result.fullName} successfully. Added ${result.createdCount} new vulnerabilities to the table.`,
    })
  } catch (error: any) {
    console.error('GitHub scanner error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred while scanning repository' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch vulnerabilities discovered via github-scan
    const scannedVulns = await prisma.vulnerability.findMany({
      where: {
        tags: { has: 'github-scan' },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        vulRemedLinks: {
          include: { remediation: true },
        },
      },
    })

    return NextResponse.json({
      data: scannedVulns,
      totalScannedRecords: scannedVulns.length,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
