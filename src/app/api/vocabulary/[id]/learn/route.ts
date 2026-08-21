import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  const vocabulary = await prisma.vocabulary.findUnique({ where: { id }, select: { id: true } })
  if (!vocabulary) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.userVocabulary.upsert({
    where: { userId_vocabularyId: { userId: session.user.id, vocabularyId: id } },
    create: {
      userId: session.user.id,
      vocabularyId: id,
      status: 'LEARNING',
    },
    update: {},
  })

  return NextResponse.redirect(new URL(`/vocabulary/${id}`, request.url), { status: 303 })
}
