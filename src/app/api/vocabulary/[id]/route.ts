import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth'
import { generateRecommendations } from '@/lib/recommendation/engine'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const vocabulary = await prisma.vocabulary.findUnique({
      where: { id },
      include: {
        meanings: true,
        examples: true,
        audioSources: { take: 1 },
      },
    })

    if (!vocabulary) {
      return NextResponse.json({ error: 'Vocabulary not found' }, { status: 404 })
    }

    const session = await auth()
    const userLevel = (session?.user?.currentLevel as any) ?? 'N5'

    // Get user's progress on this word if logged in
    let userProgress = null
    if (session?.user?.id) {
      userProgress = await prisma.userVocabulary.findUnique({
        where: { userId_vocabularyId: { userId: session.user.id, vocabularyId: id } },
      })
    }

    // Get recommendations related to this word
    const recommendations = session?.user?.id
      ? await generateRecommendations({
          userId: session.user.id,
          userLevel: userLevel,
          searchedVocabularyId: id,
          limit: 5,
        })
      : null

    return NextResponse.json({ vocabulary, userProgress, recommendations })
  } catch (error) {
    console.error('Vocabulary fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch vocabulary' }, { status: 500 })
  }
}
