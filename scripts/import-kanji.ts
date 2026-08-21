// Imports the 2,136 jōyō kanji with readings, meanings, stroke counts,
// and JLPT levels from davidluzgouveia/kanji-data (MIT license), which
// itself derives from KANJIDIC2 (EDRDG, CC BY-SA 4.0) plus the classic
// JLPT kanji level lists.
//
// Idempotent: existing kanji (by unique `character`) are left untouched.
import { PrismaClient, JLPTLevel, ReadingType } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { toRomaji as wanakanaToRomaji } from 'wanakana'
import 'dotenv/config'

const SOURCE_URL =
  'https://raw.githubusercontent.com/davidluzgouveia/kanji-data/master/kanji-jouyou.json'

const CONCURRENCY = 4

type SourceKanji = {
  strokes: number
  grade: number | null
  freq: number | null
  jlpt_old: number | null
  jlpt_new: number | null // 5 = N5 ... 1 = N1
  meanings: string[]
  readings_on: string[]
  readings_kun: string[]
}

// Strip sslmode from the URL query string so pg-connection-string doesn't enforce
// strict TLS verification which rejects the Supabase pooler's self-signed root cert.
const cleanedConnectionString = (process.env.DATABASE_URL ?? '')
  .replace(/[?&]sslmode=[^&]*/g, '')
  .replace(/\?&/, '?')
  .replace(/\?$/, '')

const pool = new Pool({
  connectionString: cleanedConnectionString,
  ssl: { rejectUnauthorized: false },
  max: CONCURRENCY,
  idleTimeoutMillis: 2000,
  connectionTimeoutMillis: 8000,
  statement_timeout: 15000,
  query_timeout: 15000,
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

function jlptFromNew(jlptNew: number | null): JLPTLevel {
  switch (jlptNew) {
    case 5:
      return JLPTLevel.N5
    case 4:
      return JLPTLevel.N4
    case 3:
      return JLPTLevel.N3
    case 2:
      return JLPTLevel.N2
    case 1:
      return JLPTLevel.N1
    default:
      return JLPTLevel.ADVANCED
  }
}

function toRomaji(reading: string): string {
  return wanakanaToRomaji(reading.replace(/\./g, ''))
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      const transient = /EMAXCONNSESSION|too many clients|connection/i.test((err as Error).message)
      if (!transient || i === attempts - 1) throw err
      await new Promise((r) => setTimeout(r, 500 * (i + 1)))
    }
  }
  throw new Error('unreachable')
}

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<void>
): Promise<void> {
  let cursor = 0
  const workers = Array.from({ length: limit }, async () => {
    while (cursor < items.length) {
      const index = cursor++
      await fn(items[index], index)
    }
  })
  await Promise.all(workers)
}

async function main() {
  console.log(`Fetching kanji dataset from ${SOURCE_URL} ...`)
  const res = await fetch(SOURCE_URL)
  if (!res.ok) throw new Error(`Failed to fetch kanji dataset: ${res.status}`)
  const source = (await res.json()) as Record<string, SourceKanji>
  const characters = Object.keys(source)
  console.log(`Loaded ${characters.length} jōyō kanji from source.`)

  const existing = await prisma.kanji.findMany({ select: { character: true } })
  const existingSet = new Set(existing.map((k) => k.character))
  console.log(`${existingSet.size} kanji already in database — will be skipped.`)

  let toImport = characters.filter((c) => !existingSet.has(c))
  const limit = process.env.IMPORT_LIMIT ? parseInt(process.env.IMPORT_LIMIT, 10) : undefined
  if (limit) toImport = toImport.slice(0, limit)
  console.log(`Importing ${toImport.length} new kanji ...`)

  let created = 0
  let failed = 0
  await runWithConcurrency(toImport, CONCURRENCY, async (character, index) => {
    const k = source[character]
    try {
      await withRetry(() =>
        prisma.kanji.create({
        data: {
          character,
          meanings: k.meanings ?? [],
          strokeCount: k.strokes,
          jlptLevel: jlptFromNew(k.jlpt_new),
          frequency: k.freq ?? 9999,
          grade: k.grade ?? null,
          unicode: character.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0'),
          onyomi: k.readings_on ?? [],
          kunyomi: k.readings_kun ?? [],
          readings: {
            create: [
              ...(k.readings_on ?? []).map((reading) => ({
                type: ReadingType.ON,
                reading,
                romaji: toRomaji(reading),
              })),
              ...(k.readings_kun ?? []).map((reading) => ({
                type: ReadingType.KUN,
                reading,
                romaji: toRomaji(reading),
              })),
            ],
          },
        },
        })
      )
      created++
    } catch (err) {
      failed++
      console.error(`Failed to import ${character}:`, (err as Error).message)
    }
    if ((index + 1) % 200 === 0) {
      console.log(`  ${index + 1}/${toImport.length} processed (${created} created, ${failed} failed)`)
    }
  })

  console.log(`Done. Created ${created} kanji, ${failed} failed, ${existingSet.size} already existed.`)
  await prisma.$disconnect()
  await pool.end()
}

main().catch(async (err) => {
  console.error(err)
  await prisma.$disconnect()
  await pool.end()
  process.exit(1)
})
