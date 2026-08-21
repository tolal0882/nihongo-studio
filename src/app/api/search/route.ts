import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { search } from '@/lib/search/engine'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const searchSchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.coerce.number().min(1).max(50).default(20),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parsed = searchSchema.safeParse({
      q: searchParams.get('q'),
      limit: searchParams.get('limit'),
    })

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query' }, { status: 400 })
    }

    const { q, limit } = parsed.data

    const session = await auth()
    const userLevel = (session?.user?.currentLevel as any) ?? 'N5'

    const results = await search(q, { limit, userLevel })

    // Log search history (fire and forget)
    if (session?.user?.id) {
      prisma.searchHistory.create({
        data: {
          userId: session.user.id,
          query: q,
          queryType: results[0]?.type ?? 'unknown',
          resultCount: results.length,
        },
      }).catch(() => {}) // non-blocking
    }

    return NextResponse.json({ results, query: q })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
