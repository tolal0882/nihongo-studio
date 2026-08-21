import { prisma } from '@/lib/db/prisma'
import type { JLPTLevel } from '@prisma/client'

const LEVEL_ORDER: JLPTLevel[] = ['ZERO', 'N5', 'N4', 'N3', 'N2', 'N1', 'ADVANCED']

interface RecommendationInput {
  userId: string
  userLevel: JLPTLevel
  searchedVocabularyId?: string
  limit?: number
}

interface RecommendationOutput {
  nextLesson: { id: string; title: string; level: JLPTLevel } | null
  learnWords: Array<{ id: string; kanji?: string | null; reading: string; meaning: string }>
  reviewWords: Array<{ id: string; kanji?: string | null; reading: string; meaning: string }>
  grammarToLearn: Array<{ id: string; pattern: string; meaning: string }>
  relatedVocabulary: Array<{ id: string; kanji?: string | null; reading: string; meaning: string }>
}

/**
 * Deterministic recommendation engine
 * Scores candidates based on multiple signals
 */
export async function generateRecommendations(
  input: RecommendationInput
): Promise<RecommendationOutput> {
  const { userId, userLevel, searchedVocabularyId, limit = 5 } = input

  const [
    nextLesson,
    learnWords,
    reviewWords,
    grammarToLearn,
    relatedVocabulary,
  ] = await Promise.all([
    getNextLesson(userId, userLevel),
    getWordsToLearn(userId, userLevel, limit),
    getWordsToReview(userId, limit),
    getGrammarToLearn(userId, userLevel, limit),
    searchedVocabularyId
      ? getRelatedVocabulary(searchedVocabularyId, userLevel, limit)
      : Promise.resolve([]),
  ])

  return { nextLesson, learnWords, reviewWords, grammarToLearn, relatedVocabulary }
}

async function getNextLesson(userId: string, userLevel: JLPTLevel) {
  // Find first incomplete lesson at user's level
  const completed = await prisma.lessonProgress.findMany({
    where: { userId, completed: true },
    select: { lessonId: true },
  })
  const completedIds = completed.map(p => p.lessonId)

  const lesson = await prisma.lesson.findFirst({
    where: {
      level: userLevel,
      isPublished: true,
      id: { notIn: completedIds },
    },
    orderBy: { order: 'asc' },
    select: { id: true, title: true, level: true },
  })

  return lesson
}

async function getWordsToLearn(userId: string, userLevel: JLPTLevel, limit: number) {
  // Words at user's level not yet in their vocabulary
  const learned = await prisma.userVocabulary.findMany({
    where: { userId },
    select: { vocabularyId: true },
  })
  const learnedIds = learned.map(v => v.vocabularyId)

  const words = await prisma.vocabulary.findMany({
    where: {
      jlptLevel: userLevel,
      id: { notIn: learnedIds },
    },
    include: { meanings: { take: 1 } },
    orderBy: { frequency: 'asc' },
    take: limit,
  })

  return words.map(w => ({
    id: w.id,
    kanji: w.kanji,
    reading: w.primaryReading,
    meaning: w.meanings[0]?.meaning ?? '',
  }))
}

async function getWordsToReview(userId: string, limit: number) {
  const due = await prisma.userVocabulary.findMany({
    where: {
      userId,
      status: { in: ['LEARNING', 'REVIEW'] },
      OR: [
        { nextReviewAt: null },
        { nextReviewAt: { lte: new Date() } },
      ],
    },
    include: {
      vocabulary: {
        include: { meanings: { take: 1 } },
      },
    },
    orderBy: { nextReviewAt: 'asc' },
    take: limit,
  })

  return due.map(d => ({
    id: d.vocabularyId,
    kanji: d.vocabulary.kanji,
    reading: d.vocabulary.primaryReading,
    meaning: d.vocabulary.meanings[0]?.meaning ?? '',
  }))
}

async function getGrammarToLearn(userId: string, userLevel: JLPTLevel, limit: number) {
  const learned = await prisma.userGrammar.findMany({
    where: { userId },
    select: { grammarId: true },
  })
  const learnedIds = learned.map(g => g.grammarId)

  const grammar = await prisma.grammar.findMany({
    where: {
      jlptLevel: userLevel,
      id: { notIn: learnedIds },
    },
    orderBy: { order: 'asc' },
    take: limit,
  })

  return grammar.map(g => ({
    id: g.id,
    pattern: g.pattern,
    meaning: g.meaning,
  }))
}

async function getRelatedVocabulary(
  vocabularyId: string,
  userLevel: JLPTLevel,
  limit: number
) {
  // Find vocabulary with the same JLPT level as related suggestions
  const source = await prisma.vocabulary.findUnique({
    where: { id: vocabularyId },
    select: { jlptLevel: true, partOfSpeech: true },
  })

  if (!source) return []

  const levelIndex = LEVEL_ORDER.indexOf(userLevel)
  const allowedLevels = LEVEL_ORDER.slice(
    Math.max(0, levelIndex - 1),
    levelIndex + 2
  )

  const related = await prisma.vocabulary.findMany({
    where: {
      id: { not: vocabularyId },
      jlptLevel: { in: allowedLevels },
    },
    include: { meanings: { take: 1 } },
    orderBy: { frequency: 'asc' },
    take: limit,
  })

  return related.map(w => ({
    id: w.id,
    kanji: w.kanji,
    reading: w.primaryReading,
    meaning: w.meanings[0]?.meaning ?? '',
  }))
}
