import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  const lesson = await prisma.lesson.findUnique({ where: { id }, select: { id: true, xpReward: true } })
  if (!lesson) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const existing = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: session.user.id, lessonId: id } },
  })

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: session.user.id, lessonId: id } },
    create: {
      userId: session.user.id,
      lessonId: id,
      completed: true,
      completedAt: new Date(),
    },
    update: {
      completed: true,
      completedAt: new Date(),
    },
  })

  // Only award XP the first time a lesson is completed
  if (!existing?.completed) {
    await prisma.profile.update({
      where: { userId: session.user.id },
      data: {
        xp: { increment: lesson.xpReward },
        lastStudiedAt: new Date(),
      },
    })
  }

  return NextResponse.redirect(new URL('/lessons', request.url), { status: 303 })
}
