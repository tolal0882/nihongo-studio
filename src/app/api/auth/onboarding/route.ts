import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const schema = z.object({
  currentLevel: z.enum(['ZERO', 'N5', 'N4', 'N3', 'N2', 'N1', 'ADVANCED']),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    const levelOrder = ['ZERO', 'N5', 'N4', 'N3', 'N2', 'N1', 'ADVANCED'] as const
    const currentIndex = levelOrder.indexOf(parsed.data.currentLevel)
    const targetLevel = levelOrder[Math.min(currentIndex + 1, levelOrder.length - 1)]

    await prisma.profile.update({
      where: { userId: session.user.id },
      data: {
        currentLevel: parsed.data.currentLevel,
        targetLevel,
        onboardingComplete: true,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Onboarding error:', error)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
