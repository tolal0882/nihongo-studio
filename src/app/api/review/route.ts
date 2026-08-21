import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'
import { calculateNextReview, answerToQuality } from '@/lib/spaced-repetition/sm2'

const reviewSchema = z.object({
  itemType: z.enum(['vocabulary', 'kanji', 'grammar']),
  itemId: z.string(),
  correct: z.boolean(),
  responseTimeMs: z.number().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = reviewSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    const { itemType, itemId, correct, responseTimeMs } = parsed.data
    const userId = session.user.id
    const quality = answerToQuality(correct, responseTimeMs)

    if (itemType === 'vocabulary') {
      const existing = await prisma.userVocabulary.findUnique({
        where: { userId_vocabularyId: { userId, vocabularyId: itemId } },
      })

      const current = existing ?? { easeFactor: 2.5, interval: 0, correctCount: 0, incorrectCount: 0 }
      const result = calculateNextReview(current, quality)

      await prisma.userVocabulary.upsert({
        where: { userId_vocabularyId: { userId, vocabularyId: itemId } },
        create: {
          userId,
          vocabularyId: itemId,
          status: correct ? 'LEARNING' : 'NEW',
          easeFactor: result.easeFactor,
          interval: result.interval,
          nextReviewAt: result.nextReviewAt,
          masteryScore: result.masteryScore,
          correctCount: correct ? 1 : 0,
          incorrectCount: correct ? 0 : 1,
          lastReviewedAt: new Date(),
        },
        update: {
          status: result.masteryScore >= 90 ? 'MASTERED' : result.masteryScore >= 60 ? 'KNOWN' : 'LEARNING',
          easeFactor: result.easeFactor,
          interval: result.interval,
          nextReviewAt: result.nextReviewAt,
          masteryScore: result.masteryScore,
          correctCount: { increment: correct ? 1 : 0 },
          incorrectCount: { increment: correct ? 0 : 1 },
          lastReviewedAt: new Date(),
        },
      })

      return NextResponse.json({ result, quality })
    }

    return NextResponse.json({ error: 'Unsupported item type' }, { status: 400 })
  } catch (error) {
    console.error('Review error:', error)
    return NextResponse.json({ error: 'Review failed' }, { status: 500 })
  }
}
