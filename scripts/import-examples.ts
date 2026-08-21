// Attaches example sentences to vocabulary that has none yet, sourced from
// the Tanaka Corpus / Tatoeba example-sentence file distributed by EDRDG
// (CC BY / CC BY-SA) — http://ftp.edrdg.org/pub/Nihongo/examples.utf.gz
//
// Format per pair of lines:
//   A: <japanese sentence>\t<english translation>#ID=...
//   B: <headword1>(<reading>)[<sense>] <headword2>{<surface form>} ...
//
// For each vocabulary word we take up to 3 of the shortest matching
// sentences (shorter sentences tend to be more beginner-friendly).
//
// Idempotent: only processes vocabulary rows that currently have zero
// examples, so re-running only fills gaps.
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import zlib from 'node:zlib'
import 'dotenv/config'

const SOURCE_URL = 'http://ftp.edrdg.org/pub/Nihongo/examples.utf.gz'
const CONCURRENCY = 4
const MAX_EXAMPLES_PER_WORD = 3
const MAX_CANDIDATES_PER_KEY = 20

type Sentence = { japanese: string; english: string }

function extractBase(token: string): string {
  const m = /^[^([{]+/.exec(token)
  return (m ? m[0] : token).trim()
}

function extractReading(token: string): string | null {
  const m = /\(([^)]+)\)/.exec(token)
  if (!m) return null
  const reading = m[1]
  if (reading.startsWith('#')) return null // JMdict seq-id reference, not a reading
  if (!/^[぀-ゟ゠-ヿー]+$/.test(reading)) return null
  return reading
}

async function loadSentenceIndex(): Promise<{
  baseIndex: Map<string, Sentence[]>
  readingIndex: Map<string, Sentence[]>
}> {
  console.log(`Downloading example sentences from ${SOURCE_URL} ...`)
  const res = await fetch(SOURCE_URL)
  if (!res.ok) throw new Error(`Failed to fetch examples: ${res.status}`)
  const gz = Buffer.from(await res.arrayBuffer())
  console.log(`Decompressing (${(gz.length / 1024 / 1024).toFixed(1)} MB gz) ...`)
  const text = zlib.gunzipSync(gz).toString('utf-8')
  const lines = text.split('\n')
  console.log(`Parsing ${lines.length} lines ...`)

  const baseIndex = new Map<string, Sentence[]>()
  const readingIndex = new Map<string, Sentence[]>()

  function addTo(map: Map<string, Sentence[]>, key: string, sentence: Sentence) {
    let arr = map.get(key)
    if (!arr) {
      arr = []
      map.set(key, arr)
    }
    if (arr.length < MAX_CANDIDATES_PER_KEY) arr.push(sentence)
  }

  let pending: Sentence | null = null
  let pairCount = 0
  for (const line of lines) {
    if (line.startsWith('A: ')) {
      const rest = line.slice(3)
      const tabIdx = rest.indexOf('\t')
      if (tabIdx === -1) {
        pending = null
        continue
      }
      const japanese = rest.slice(0, tabIdx).trim()
      const english = rest
        .slice(tabIdx + 1)
        .replace(/#ID=.*$/, '')
        .trim()
      pending = japanese && english ? { japanese, english } : null
    } else if (line.startsWith('B: ') && pending) {
      const tokens = line.slice(3).trim().split(/\s+/)
      for (const token of tokens) {
        const base = extractBase(token)
        if (!base) continue
        addTo(baseIndex, base, pending)
        const reading = extractReading(token)
        if (reading) addTo(readingIndex, reading, pending)
      }
      pairCount++
      pending = null
    }
  }
  console.log(`Indexed ${pairCount} example sentence pairs.`)
  return { baseIndex, readingIndex }
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

function pickBest(candidates: Sentence[] | undefined): Sentence[] {
  if (!candidates || candidates.length === 0) return []
  const deduped = [...new Map(candidates.map((c) => [c.japanese, c])).values()]
  deduped.sort((a, b) => a.japanese.length - b.japanese.length)
  return deduped.slice(0, MAX_EXAMPLES_PER_WORD)
}

async function main() {
  const { baseIndex, readingIndex } = await loadSentenceIndex()

  console.log('Loading vocabulary without examples ...')
  let vocab = await prisma.vocabulary.findMany({
    where: { examples: { none: {} } },
    select: { id: true, kanji: true, primaryReading: true },
  })
  const limit = process.env.IMPORT_LIMIT ? parseInt(process.env.IMPORT_LIMIT, 10) : undefined
  if (limit) vocab = vocab.slice(0, limit)
  console.log(`${vocab.length} vocabulary entries need examples.`)

  let updated = 0
  let skippedNoMatch = 0
  let failed = 0
  await runWithConcurrency(vocab, CONCURRENCY, async (word, index) => {
    const candidates =
      (word.kanji && baseIndex.get(word.kanji)) ||
      baseIndex.get(word.primaryReading) ||
      readingIndex.get(word.primaryReading) ||
      undefined
    const sentences = pickBest(candidates)
    if (sentences.length === 0) {
      skippedNoMatch++
      return
    }
    try {
      await withRetry(() =>
        prisma.vocabularyExample.createMany({
          data: sentences.map((s, order) => ({
            vocabularyId: word.id,
            japanese: s.japanese,
            english: s.english,
            order,
          })),
        })
      )
      updated++
    } catch (err) {
      failed++
      console.error(`Failed to add examples for ${word.kanji ?? word.primaryReading}:`, (err as Error).message)
    }
    if ((index + 1) % 500 === 0) {
      console.log(`  ${index + 1}/${vocab.length} processed (${updated} updated, ${skippedNoMatch} no match, ${failed} failed)`)
    }
  })

  console.log(
    `Done. Added examples to ${updated} words, ${skippedNoMatch} had no matching sentence, ${failed} failed.`
  )
  await prisma.$disconnect()
  await pool.end()
}

main().catch(async (err) => {
  console.error(err)
  await prisma.$disconnect()
  await pool.end()
  process.exit(1)
})
