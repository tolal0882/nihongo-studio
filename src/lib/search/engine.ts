import { prisma } from '@/lib/db/prisma'
import {
  detectInputType,
  normalizeInput,
  normalizeRomaji,
  katakanaToHiragana,
  levenshtein,
} from '@/lib/japanese/normalize'
import type { JLPTLevel } from '@prisma/client'

export interface SearchResult {
  id: string
  type: 'vocabulary' | 'kanji' | 'grammar'
  score: number
  kanji?: string | null
  primaryReading?: string
  romaji?: string
  meanings: string[]
  jlptLevel: JLPTLevel
  partOfSpeech?: string[]
  isCommon?: boolean
}

export interface SearchOptions {
  limit?: number
  userLevel?: JLPTLevel
  includeTypes?: ('vocabulary' | 'kanji' | 'grammar')[]
}

/**
 * Universal search engine — handles Japanese, romaji, English input
 */
export async function search(
  rawQuery: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const { limit = 20, includeTypes = ['vocabulary', 'kanji', 'grammar'] } = options

  const query = normalizeInput(rawQuery)
  if (!query) return []

  const inputType = detectInputType(query)
  const normalizedRomaji = normalizeRomaji(query)
  const hiraganaQuery = katakanaToHiragana(query)

  const results: SearchResult[] = []

  // ── Vocabulary Search ──────────────────────────────────────────────────────
  if (includeTypes.includes('vocabulary')) {
    const vocabResults = await searchVocabulary(query, normalizedRomaji, hiraganaQuery, inputType)
    results.push(...vocabResults)
  }

  // ── Kanji Search ───────────────────────────────────────────────────────────
  if (includeTypes.includes('kanji') && query.length === 1) {
    const kanjiResults = await searchKanji(query)
    results.push(...kanjiResults)
  }

  // ── Grammar Search ─────────────────────────────────────────────────────────
  if (includeTypes.includes('grammar')) {
    const grammarResults = await searchGrammar(query, normalizedRomaji)
    results.push(...grammarResults)
  }

  // Sort by score descending, then frequency ascending
  results.sort((a, b) => b.score - a.score)

  return results.slice(0, limit)
}

async function searchVocabulary(
  query: string,
  normalizedRomaji: string,
  hiraganaQuery: string,
  inputType: string
): Promise<SearchResult[]> {
  // Build multi-condition search
  const [exactMatches, meaningMatches] = await Promise.all([
    // Direct field matching
    prisma.vocabulary.findMany({
      where: {
        OR: [
          { kanji: { equals: query, mode: 'insensitive' } },
          { primaryReading: { equals: hiraganaQuery } },
          { romaji: { equals: normalizedRomaji, mode: 'insensitive' } },
          { katakana: { equals: query } },
          // prefix matches
          { romaji: { startsWith: normalizedRomaji, mode: 'insensitive' } },
          { primaryReading: { startsWith: hiraganaQuery } },
          { kanji: { startsWith: query } },
        ],
      },
      include: { meanings: true },
      take: 30,
      orderBy: { frequency: 'asc' },
    }),
    // English meaning search
    prisma.vocabulary.findMany({
      where: {
        meanings: {
          some: {
            meaning: {
              contains: query,
              mode: 'insensitive',
            },
          },
        },
      },
      include: { meanings: true },
      take: 15,
      orderBy: { frequency: 'asc' },
    }),
  ])

  const seen = new Set<string>()
  const scored: SearchResult[] = []

  const scoreVocab = (v: typeof exactMatches[number], isMeaningMatch: boolean): number => {
    let score = 0

    // Exact matches score highest
    if (v.kanji === query) score += 100
    if (v.primaryReading === hiraganaQuery) score += 90
    if (v.romaji.toLowerCase() === normalizedRomaji.toLowerCase()) score += 85
    if (v.katakana === query) score += 80

    // Prefix matches
    if (v.kanji?.startsWith(query)) score += 50
    if (v.primaryReading.startsWith(hiraganaQuery)) score += 45
    if (v.romaji.toLowerCase().startsWith(normalizedRomaji.toLowerCase())) score += 40

    // Meaning match
    if (isMeaningMatch) score += 30

    // Frequency bonus (lower frequency number = more common)
    if (v.frequency < 1000) score += 20
    else if (v.frequency < 5000) score += 10

    if (v.isCommon) score += 15

    // Fuzzy match penalty if none of the above
    if (score === 0) {
      const dist = levenshtein(v.romaji.toLowerCase(), normalizedRomaji.toLowerCase())
      if (dist <= 2) score = Math.max(10, 30 - dist * 10)
    }

    return score
  }

  for (const v of [...exactMatches, ...meaningMatches]) {
    if (seen.has(v.id)) continue
    seen.add(v.id)
    const isMeaning = meaningMatches.some(m => m.id === v.id)
    const score = scoreVocab(v, isMeaning)
    if (score > 0) {
      scored.push({
        id: v.id,
        type: 'vocabulary',
        score,
        kanji: v.kanji,
        primaryReading: v.primaryReading,
        romaji: v.romaji,
        meanings: v.meanings.map(m => m.meaning),
        jlptLevel: v.jlptLevel,
        partOfSpeech: v.partOfSpeech,
        isCommon: v.isCommon,
      })
    }
  }

  return scored
}

async function searchKanji(query: string): Promise<SearchResult[]> {
  const kanji = await prisma.kanji.findUnique({
    where: { character: query },
  })
  if (!kanji) return []

  return [{
    id: kanji.id,
    type: 'kanji',
    score: 100,
    kanji: kanji.character,
    primaryReading: kanji.kunyomi[0] ?? kanji.onyomi[0] ?? '',
    romaji: '',
    meanings: kanji.meanings,
    jlptLevel: kanji.jlptLevel,
  }]
}

async function searchGrammar(query: string, normalizedRomaji: string): Promise<SearchResult[]> {
  const grammars = await prisma.grammar.findMany({
    where: {
      OR: [
        { pattern: { contains: query, mode: 'insensitive' } },
        { meaning: { contains: query, mode: 'insensitive' } },
      ],
    },
    take: 10,
  })

  return grammars.map(g => ({
    id: g.id,
    type: 'grammar' as const,
    score: 40,
    kanji: g.pattern,
    primaryReading: g.pattern,
    romaji: '',
    meanings: [g.meaning],
    jlptLevel: g.jlptLevel,
  }))
}
