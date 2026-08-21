import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const progressSchema = z.object({
  level: z.enum(['ZERO', 'N5', 'N4', 'N3', 'N2', 'N1', 'ADVANCED']).optional(),
  xpDelta: z.number().optional(),
  studyMinutesDelta: z.number().optional(),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    })

    const reviewCount = await prisma.userVocabulary.count({
      where: {
        userId: session.user.id,
        status: { in: ['LEARNING', 'REVIEW'] },
        OR: [
          { nextReviewAt: null },
          { nextReviewAt: { lte: new Date() } },
        ],
      },
    })

    const learnedCount = await prisma.userVocabulary.count({
      where: {
        userId: session.user.id,
        status: { in: ['KNOWN', 'MASTERED'] },
      },
    })

    return NextResponse.json({ profile, reviewCount, learnedCount })
  } catch (error) {
    console.error('Progress fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = progressSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    const { xpDelta, studyMinutesDelta } = parsed.data

    const profile = await prisma.profile.update({
      where: { userId: session.user.id },
      data: {
        ...(xpDelta && { xp: { increment: xpDelta } }),
        ...(studyMinutesDelta && { totalStudyMinutes: { increment: studyMinutesDelta } }),
        lastStudiedAt: new Date(),
      },
    })

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Progress update error:', error)
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 })
  }
}
