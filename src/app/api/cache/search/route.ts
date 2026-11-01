import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { semanticSearch } from '@/lib/rag/vectorSearch'
import { z } from 'zod'

const SearchSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  threshold: z.number().min(0).max(1).default(0.6),
  limit: z.number().min(1).max(50).default(10),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = SearchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const results = await semanticSearch(
      parsed.data.query,
      parsed.data.threshold,
      parsed.data.limit
    )

    return NextResponse.json({ data: results })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
