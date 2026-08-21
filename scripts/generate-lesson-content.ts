// Populates lesson content sections for the 22 hand-scaffolded lessons
// (courses/lesson titles existed, but every lesson had zero sections).
//
// Kana and vocabulary sections are pulled directly from already-imported
// DB data (grounded, not invented). Grammar explanations are generated
// with Gemini for standard, well-established N5 grammar points, then
// stored — the AI is only used for pedagogical prose, never for facts
// like readings or JLPT levels.
//
// Idempotent: skips any lesson that already has sections.
import { PrismaClient, KanaType, SectionType } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { GoogleGenAI } from '@google/genai'
import 'dotenv/config'

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
const MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.6-flash'

const cleanedConnectionString = (process.env.DATABASE_URL ?? '')
  .replace(/[?&]sslmode=[^&]*/g, '')
  .replace(/\?&/, '?')
  .replace(/\?$/, '')

const pool = new Pool({
  connectionString: cleanedConnectionString,
  ssl: { rejectUnauthorized: false },
  max: 3,
  idleTimeoutMillis: 2000,
  connectionTimeoutMillis: 8000,
  statement_timeout: 30000,
  query_timeout: 30000,
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const KATAKANA: { character: string; romaji: string; group: string }[] = [
  { character: 'ア', romaji: 'a', group: 'a' }, { character: 'イ', romaji: 'i', group: 'a' }, { character: 'ウ', romaji: 'u', group: 'a' }, { character: 'エ', romaji: 'e', group: 'a' }, { character: 'オ', romaji: 'o', group: 'a' },
  { character: 'カ', romaji: 'ka', group: 'ka' }, { character: 'キ', romaji: 'ki', group: 'ka' }, { character: 'ク', romaji: 'ku', group: 'ka' }, { character: 'ケ', romaji: 'ke', group: 'ka' }, { character: 'コ', romaji: 'ko', group: 'ka' },
  { character: 'サ', romaji: 'sa', group: 'sa' }, { character: 'シ', romaji: 'shi', group: 'sa' }, { character: 'ス', romaji: 'su', group: 'sa' }, { character: 'セ', romaji: 'se', group: 'sa' }, { character: 'ソ', romaji: 'so', group: 'sa' },
  { character: 'タ', romaji: 'ta', group: 'ta' }, { character: 'チ', romaji: 'chi', group: 'ta' }, { character: 'ツ', romaji: 'tsu', group: 'ta' }, { character: 'テ', romaji: 'te', group: 'ta' }, { character: 'ト', romaji: 'to', group: 'ta' },
  { character: 'ナ', romaji: 'na', group: 'na' }, { character: 'ニ', romaji: 'ni', group: 'na' }, { character: 'ヌ', romaji: 'nu', group: 'na' }, { character: 'ネ', romaji: 'ne', group: 'na' }, { character: 'ノ', romaji: 'no', group: 'na' },
  { character: 'ハ', romaji: 'ha', group: 'ha' }, { character: 'ヒ', romaji: 'hi', group: 'ha' }, { character: 'フ', romaji: 'fu', group: 'ha' }, { character: 'ヘ', romaji: 'he', group: 'ha' }, { character: 'ホ', romaji: 'ho', group: 'ha' },
  { character: 'マ', romaji: 'ma', group: 'ma' }, { character: 'ミ', romaji: 'mi', group: 'ma' }, { character: 'ム', romaji: 'mu', group: 'ma' }, { character: 'メ', romaji: 'me', group: 'ma' }, { character: 'モ', romaji: 'mo', group: 'ma' },
  { character: 'ヤ', romaji: 'ya', group: 'ya' }, { character: 'ユ', romaji: 'yu', group: 'ya' }, { character: 'ヨ', romaji: 'yo', group: 'ya' },
  { character: 'ラ', romaji: 'ra', group: 'ra' }, { character: 'リ', romaji: 'ri', group: 'ra' }, { character: 'ル', romaji: 'ru', group: 'ra' }, { character: 'レ', romaji: 're', group: 'ra' }, { character: 'ロ', romaji: 'ro', group: 'ra' },
  { character: 'ワ', romaji: 'wa', group: 'wa' }, { character: 'ヲ', romaji: 'wo', group: 'wa' },
  { character: 'ン', romaji: 'n', group: 'n' },
]

type LessonConfig =
  | { title: string; kind: 'kana'; kanaType: KanaType; groups: string[] }
  | { title: string; kind: 'vocab'; keywords?: string[]; exactKanji?: string[]; posIncludes?: string[] }
  | { title: string; kind: 'grammar' }
  | { title: string; kind: 'overview'; topic: string }

const LESSONS: LessonConfig[] = [
  { title: 'What is Japanese?', kind: 'overview', topic: 'a friendly overview of the Japanese language: that it uses three writing systems (hiragana, katakana, kanji), basic word order (SOV), and what a total beginner should expect to learn first' },
  { title: 'Hiragana: あいうえお', kind: 'kana', kanaType: 'HIRAGANA', groups: ['a'] },
  { title: 'Hiragana: かきくけこ', kind: 'kana', kanaType: 'HIRAGANA', groups: ['ka'] },
  { title: 'Hiragana: さしすせそ', kind: 'kana', kanaType: 'HIRAGANA', groups: ['sa'] },
  { title: 'Hiragana: Complete!', kind: 'kana', kanaType: 'HIRAGANA', groups: ['ta', 'na', 'ha', 'ma', 'ya', 'ra', 'wa', 'n'] },
  { title: 'Katakana Introduction', kind: 'kana', kanaType: 'KATAKANA', groups: ['a', 'ka', 'sa', 'ta', 'na', 'ha', 'ma', 'ya', 'ra', 'wa', 'n'] },
  { title: 'Basic Greetings', kind: 'vocab', keywords: ['hello', 'good morning', 'good evening', 'good night', 'goodbye', 'thank', 'sorry', 'excuse me', 'please', 'nice to meet', 'yes', 'no'] },
  { title: 'Lesson 01: Self Introduction', kind: 'vocab', keywords: ['name', 'student', 'teacher', 'company', 'from (a place)', 'person', 'called'] },
  { title: 'Lesson 02: は and です', kind: 'grammar' },
  { title: 'Lesson 03: Basic Nouns', kind: 'vocab', posIncludes: ['noun'] },
  { title: 'Lesson 04: Numbers 1-10', kind: 'vocab', exactKanji: ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'] },
  { title: 'Lesson 05: Basic Verbs', kind: 'vocab', posIncludes: ['ichidan verb', 'godan verb (-ru)', 'godan verb (-u)', 'godan verb (-ku)'] },
  { title: 'Lesson 06: Particles は・が・を', kind: 'grammar' },
  { title: 'Lesson 07: Particles に・で・へ', kind: 'grammar' },
  { title: 'Lesson 08: Food & Drink', kind: 'vocab', keywords: ['eat', 'drink', 'food', 'rice', 'tea', 'water', 'meat', 'fish', 'fruit', 'vegetable', 'restaurant', 'breakfast', 'lunch', 'dinner'] },
  { title: 'Lesson 09: Family', kind: 'vocab', keywords: ['mother', 'father', 'brother', 'sister', 'family', 'parent', 'child', 'grandmother', 'grandfather', 'husband', 'wife'] },
  { title: 'Lesson 10: Time & Schedule', kind: 'vocab', keywords: ["o'clock", 'today', 'tomorrow', 'yesterday', 'week', 'month', 'morning', 'evening', 'night', 'schedule', 'minute', 'hour'] },
  { title: 'Lesson 11: ています', kind: 'grammar' },
  { title: 'Lesson 12: たい form — Want to', kind: 'grammar' },
  { title: 'Lesson 13: Past Tense', kind: 'grammar' },
  { title: 'Lesson 14: て-form', kind: 'grammar' },
  { title: 'Lesson 15: Adjectives', kind: 'vocab', posIncludes: ['i-adjective', 'na-adjective'] },
]

async function generateGrammarContent(title: string, level: string) {
  const prompt = `You are writing a short JLPT ${level} grammar lesson titled "${title}" for a Japanese learning app.

Return ONLY valid JSON in this exact shape, no markdown fences:
{
  "explanation": "2-3 sentence plain-English introduction to this grammar point",
  "pattern": "the grammar pattern in Japanese, e.g. 〜たいです",
  "meaning": "short English meaning",
  "formation": "how to form it, e.g. Verb stem + たい",
  "examples": [
    {"ja": "Japanese example sentence", "en": "English translation"},
    {"ja": "second Japanese example sentence", "en": "English translation"}
  ]
}`
  const response = await client.models.generateContent({
    model: MODEL,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  })
  const raw = response.text ?? '{}'
  const match = raw.match(/\{[\s\S]*\}/)
  return match ? JSON.parse(match[0]) : null
}

async function generateOverviewContent(title: string, topic: string) {
  const prompt = `Write a short, encouraging lesson introduction (3-4 short paragraphs, plain text, no markdown headers) for a total-beginner Japanese lesson titled "${title}". Topic: ${topic}. Keep it simple and friendly.`
  const response = await client.models.generateContent({
    model: MODEL,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  })
  return response.text ?? ''
}

async function main() {
  // Seed katakana if missing
  const katakanaCount = await prisma.kana.count({ where: { type: 'KATAKANA' } })
  if (katakanaCount === 0) {
    console.log('Seeding katakana...')
    await prisma.kana.createMany({
      data: KATAKANA.map((k, i) => ({ ...k, type: KanaType.KATAKANA, order: i })),
    })
    console.log(`Created ${KATAKANA.length} katakana rows.`)
  }

  const lessons = await prisma.lesson.findMany({ include: { sections: { select: { id: true } } } })

  for (const config of LESSONS) {
    const lesson = lessons.find((l) => l.title === config.title)
    if (!lesson) {
      console.log(`SKIP (not found in DB): ${config.title}`)
      continue
    }
    if (lesson.sections.length > 0) {
      console.log(`SKIP (already has sections): ${config.title}`)
      continue
    }

    console.log(`Generating: ${config.title} [${config.kind}]`)
    const sectionsToCreate: { type: SectionType; order: number; title: string | null; content: unknown }[] = []

    if (config.kind === 'kana') {
      const kana = await prisma.kana.findMany({
        where: { type: config.kanaType, group: { in: config.groups } },
        orderBy: { order: 'asc' },
      })
      sectionsToCreate.push({
        type: SectionType.EXPLANATION,
        order: 0,
        title: 'Overview',
        content: {
          text: `Learn to read these ${config.kanaType === 'HIRAGANA' ? 'hiragana' : 'katakana'} characters. Practice each one — say the sound aloud and try writing it — until you can recognize it instantly.`,
        },
      })
      sectionsToCreate.push({
        type: SectionType.VOCABULARY,
        order: 1,
        title: 'Characters',
        content: {
          items: kana.map((k) => ({ reading: k.character, romaji: k.romaji, meaning: k.romaji })),
        },
      })
    } else if (config.kind === 'vocab') {
      let vocab: { kanji: string | null; primaryReading: string; romaji: string; meanings: { meaning: string }[] }[] = []

      if (config.exactKanji) {
        vocab = await prisma.vocabulary.findMany({
          where: { kanji: { in: config.exactKanji }, jlptLevel: lesson.level },
          include: { meanings: { take: 1 } },
        })
        vocab.sort((a, b) => config.exactKanji!.indexOf(a.kanji!) - config.exactKanji!.indexOf(b.kanji!))
      } else if (config.posIncludes) {
        vocab = await prisma.vocabulary.findMany({
          where: { jlptLevel: lesson.level, partOfSpeech: { hasSome: config.posIncludes }, isCommon: true },
          include: { meanings: { take: 1 } },
          orderBy: { frequency: 'asc' },
          take: 8,
        })
      } else if (config.keywords) {
        vocab = await prisma.vocabulary.findMany({
          where: {
            jlptLevel: lesson.level,
            meanings: { some: { meaning: { in: config.keywords, mode: 'insensitive' } } },
          },
          include: { meanings: { take: 1 } },
          orderBy: { frequency: 'asc' },
          take: 8,
        })
        if (vocab.length < 4) {
          // fall back to substring match if exact gloss match is too sparse
          vocab = await prisma.vocabulary.findMany({
            where: {
              jlptLevel: lesson.level,
              OR: config.keywords.map((kw) => ({ meanings: { some: { meaning: { contains: kw, mode: 'insensitive' as const } } } })),
            },
            include: { meanings: { take: 1 } },
            orderBy: { frequency: 'asc' },
            take: 8,
          })
        }
      }

      sectionsToCreate.push({
        type: SectionType.EXPLANATION,
        order: 0,
        title: 'Overview',
        content: {
          text: `In this lesson you'll learn ${vocab.length} essential ${lesson.level} words for "${lesson.title.replace(/^Lesson \d+:\s*/, '')}". Study each word's reading and meaning, then try using it in a sentence.`,
        },
      })
      sectionsToCreate.push({
        type: SectionType.VOCABULARY,
        order: 1,
        title: 'Vocabulary',
        content: {
          items: vocab.map((v) => ({
            kanji: v.kanji ?? undefined,
            reading: v.primaryReading,
            romaji: v.romaji,
            meaning: v.meanings[0]?.meaning ?? '',
          })),
        },
      })
    } else if (config.kind === 'grammar') {
      const generated = await generateGrammarContent(config.title, lesson.level)
      if (generated) {
        sectionsToCreate.push({
          type: SectionType.EXPLANATION,
          order: 0,
          title: 'Overview',
          content: { text: generated.explanation ?? '' },
        })
        sectionsToCreate.push({
          type: SectionType.GRAMMAR,
          order: 1,
          title: config.title,
          content: {
            pattern: generated.pattern ?? '',
            meaning: generated.meaning ?? '',
            formation: generated.formation ?? '',
            examples: generated.examples ?? [],
          },
        })
      }
    } else if (config.kind === 'overview') {
      const text = await generateOverviewContent(config.title, config.topic)
      sectionsToCreate.push({
        type: SectionType.EXPLANATION,
        order: 0,
        title: 'Overview',
        content: { text },
      })
    }

    if (sectionsToCreate.length === 0) {
      console.log(`  no content generated for ${config.title}, skipping`)
      continue
    }

    await prisma.lessonSection.createMany({
      data: sectionsToCreate.map((s) => ({
        lessonId: lesson.id,
        type: s.type,
        order: s.order,
        title: s.title,
        content: s.content as object,
      })),
    })
    console.log(`  created ${sectionsToCreate.length} sections`)
  }

  console.log('Done.')
  await prisma.$disconnect()
  await pool.end()
}

main().catch(async (err) => {
  console.error(err)
  await prisma.$disconnect()
  await pool.end()
  process.exit(1)
})
