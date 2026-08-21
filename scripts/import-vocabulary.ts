// Imports JLPT-tagged vocabulary (~8,000 words across N5-N1) from
// elzup/jlpt-word-list (MIT license), enriched with part-of-speech,
// "common word" status, and approximate frequency rank cross-referenced
// against JMdict (EDRDG, CC BY-SA 4.0) — http://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz
//
// Words are processed easiest-level-first (N5 -> N1) so that a word
// appearing on multiple JLPT lists is recorded at its earliest level.
//
// Idempotent: dedupes against existing (kanji, primaryReading) pairs
// already in the database.
import { PrismaClient, JLPTLevel } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { toRomaji as wanakanaToRomaji } from 'wanakana'
import { parse as parseCsv } from 'csv-parse/sync'
import zlib from 'node:zlib'
import 'dotenv/config'

const JMDICT_URL = 'http://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz'
const JLPT_LIST_BASE = 'https://raw.githubusercontent.com/elzup/jlpt-word-list/master/src'
const CONCURRENCY = 4

const LEVELS: { file: string; level: JLPTLevel }[] = [
  { file: 'n5', level: JLPTLevel.N5 },
  { file: 'n4', level: JLPTLevel.N4 },
  { file: 'n3', level: JLPTLevel.N3 },
  { file: 'n2', level: JLPTLevel.N2 },
  { file: 'n1', level: JLPTLevel.N1 },
]

// Common JMdict part-of-speech entity codes -> human-readable labels.
// Codes not in this table are kept as-is (raw JMdict mnemonic).
const POS_LABELS: Record<string, string> = {
  n: 'noun',
  'v1': 'ichidan verb',
  'v5k': 'godan verb (-ku)',
  'v5g': 'godan verb (-gu)',
  'v5s': 'godan verb (-su)',
  'v5t': 'godan verb (-tsu)',
  'v5n': 'godan verb (-nu)',
  'v5b': 'godan verb (-bu)',
  'v5m': 'godan verb (-mu)',
  'v5r': 'godan verb (-ru)',
  'v5u': 'godan verb (-u)',
  'v5aru': 'godan verb -aru',
  vs: 'suru verb',
  vk: 'kuru verb',
  'adj-i': 'i-adjective',
  'adj-na': 'na-adjective',
  'adj-no': 'no-adjective',
  'adj-pn': 'pre-noun adjectival',
  adv: 'adverb',
  conj: 'conjunction',
  int: 'interjection',
  prt: 'particle',
  'aux-v': 'auxiliary verb',
  'aux-adj': 'auxiliary adjective',
  exp: 'expression',
  pn: 'pronoun',
  ctr: 'counter',
  pref: 'prefix',
  suf: 'suffix',
  num: 'numeric',
  vi: 'intransitive verb',
  vt: 'transitive verb',
}

type JmdictInfo = {
  pos: string[]
  common: boolean
  frequency: number
  glosses: string[]
}

function toRomaji(text: string): string {
  return wanakanaToRomaji(text)
}

function isCommonPriority(tags: Set<string>): boolean {
  for (const t of tags) {
    if (t === 'ichi1' || t === 'news1' || t === 'spec1' || t === 'gai1') return true
  }
  return false
}

function estimateFrequency(tags: Set<string>, common: boolean): number {
  for (const t of tags) {
    const m = /^nf(\d+)$/.exec(t)
    if (m) return parseInt(m[1], 10) * 500 - 250
  }
  return common ? 3000 : 9999
}

async function loadJmdictIndex(): Promise<{
  byKanjiReading: Map<string, JmdictInfo>
  byKebOnly: Map<string, JmdictInfo>
  byReadingNoKanji: Map<string, JmdictInfo>
}> {
  console.log(`Downloading JMdict from ${JMDICT_URL} ...`)
  const res = await fetch(JMDICT_URL)
  if (!res.ok) throw new Error(`Failed to fetch JMdict: ${res.status}`)
  const gz = Buffer.from(await res.arrayBuffer())
  console.log(`Decompressing (${(gz.length / 1024 / 1024).toFixed(1)} MB gz) ...`)
  const xml = zlib.gunzipSync(gz).toString('utf-8')
  console.log(`Parsing ${(xml.length / 1024 / 1024).toFixed(1)} MB of XML ...`)

  const byKanjiReading = new Map<string, JmdictInfo>()
  const byKebOnly = new Map<string, JmdictInfo>()
  const byReadingNoKanji = new Map<string, JmdictInfo>()

  const entryChunks = xml.split('<entry>')
  let count = 0
  for (let i = 1; i < entryChunks.length; i++) {
    const chunk = entryChunks[i]
    const endIdx = chunk.indexOf('</entry>')
    if (endIdx === -1) continue
    const body = chunk.slice(0, endIdx)

    const kebs = [...body.matchAll(/<keb>([^<]+)<\/keb>/g)].map((m) => m[1])
    const rebs = [...body.matchAll(/<reb>([^<]+)<\/reb>/g)].map((m) => m[1])
    if (rebs.length === 0) continue

    const priorityTags = new Set<string>()
    for (const m of body.matchAll(/<(?:ke_pri|re_pri)>([^<]+)<\/(?:ke_pri|re_pri)>/g)) {
      priorityTags.add(m[1])
    }
    const posSet = new Set<string>()
    for (const m of body.matchAll(/<pos>&([^;]+);<\/pos>/g)) {
      posSet.add(POS_LABELS[m[1]] ?? m[1])
    }
    const glosses: string[] = []
    for (const senseBody of body.split('<sense>').slice(1)) {
      const senseEnd = senseBody.indexOf('</sense>')
      const sense = senseEnd === -1 ? senseBody : senseBody.slice(0, senseEnd)
      const senseGlosses = [...sense.matchAll(/<gloss>([^<]+)<\/gloss>/g)].map((m) => m[1])
      if (senseGlosses.length > 0) glosses.push(senseGlosses.join('; '))
      if (glosses.length >= 6) break
    }

    const common = isCommonPriority(priorityTags)
    const info: JmdictInfo = {
      pos: [...posSet],
      common,
      frequency: estimateFrequency(priorityTags, common),
      glosses,
    }

    if (kebs.length === 0) {
      for (const reb of rebs) {
        if (!byReadingNoKanji.has(reb)) byReadingNoKanji.set(reb, info)
      }
    } else {
      for (const keb of kebs) {
        if (!byKebOnly.has(keb)) byKebOnly.set(keb, info)
        for (const reb of rebs) {
          byKanjiReading.set(`${keb}|${reb}`, info)
        }
      }
    }
    count++
  }
  console.log(`Indexed ${count} JMdict entries.`)
  return { byKanjiReading, byKebOnly, byReadingNoKanji }
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

const KANJI_RANGE = /[一-龯々]/
const KATAKANA_ONLY = /^[゠-ヿー]+$/

async function main() {
  const jmdict = await loadJmdictIndex()

  console.log('Loading existing vocabulary for dedup ...')
  const existingRows = await prisma.vocabulary.findMany({
    select: { kanji: true, primaryReading: true },
  })
  const seen = new Set(existingRows.map((r) => `${r.kanji ?? ''}|${r.primaryReading}`))
  console.log(`${seen.size} existing vocabulary entries loaded.`)

  type Row = {
    kanji: string | null
    katakana: string | null
    primaryReading: string
    romaji: string
    jlptLevel: JLPTLevel
    partOfSpeech: string[]
    isCommon: boolean
    frequency: number
    meanings: string[]
  }
  const toImport: Row[] = []

  for (const { file, level } of LEVELS) {
    console.log(`Fetching ${file}.csv ...`)
    const res = await fetch(`${JLPT_LIST_BASE}/${file}.csv`)
    if (!res.ok) throw new Error(`Failed to fetch ${file}.csv: ${res.status}`)
    const text = await res.text()
    const records: { expression: string; reading: string; meaning: string }[] = parseCsv(text, {
      columns: true,
      skip_empty_lines: true,
    })

    let addedForLevel = 0
    for (const row of records) {
      const expression = row.expression?.trim()
      const reading = row.reading?.trim()
      if (!expression || !reading) continue

      const hasKanji = KANJI_RANGE.test(expression)
      const kanji = hasKanji ? expression : null
      const katakana = !hasKanji && KATAKANA_ONLY.test(expression) ? expression : null
      const dedupKey = `${kanji ?? ''}|${reading}`
      if (seen.has(dedupKey)) continue
      seen.add(dedupKey)

      const match =
        (kanji && jmdict.byKanjiReading.get(`${kanji}|${reading}`)) ||
        (kanji && jmdict.byKebOnly.get(kanji)) ||
        (!kanji && jmdict.byReadingNoKanji.get(reading)) ||
        null

      const meanings = match?.glosses.length
        ? match.glosses
        : (row.meaning ?? '').split(/,\s*/).filter(Boolean)

      toImport.push({
        kanji,
        katakana,
        primaryReading: reading,
        romaji: toRomaji(reading),
        jlptLevel: level,
        partOfSpeech: match?.pos ?? [],
        isCommon: match?.common ?? false,
        frequency: match?.frequency ?? 9999,
        meanings: meanings.length ? meanings : [row.meaning ?? ''],
      })
      addedForLevel++
    }
    console.log(`  ${file.toUpperCase()}: ${addedForLevel} new words queued (${records.length} in list).`)
  }

  console.log(`Importing ${toImport.length} new vocabulary entries ...`)
  let created = 0
  let failed = 0
  await runWithConcurrency(toImport, CONCURRENCY, async (row, index) => {
    try {
      await withRetry(() =>
        prisma.vocabulary.create({
          data: {
            kanji: row.kanji,
            katakana: row.katakana,
            primaryReading: row.primaryReading,
            romaji: row.romaji,
            jlptLevel: row.jlptLevel,
            partOfSpeech: row.partOfSpeech,
            isCommon: row.isCommon,
            frequency: row.frequency,
            meanings: {
              create: row.meanings.map((meaning, order) => ({ meaning, order })),
            },
          },
        })
      )
      created++
    } catch (err) {
      failed++
      console.error(`Failed to import ${row.kanji ?? row.primaryReading}:`, (err as Error).message)
    }
    if ((index + 1) % 500 === 0) {
      console.log(`  ${index + 1}/${toImport.length} processed (${created} created, ${failed} failed)`)
    }
  })

  console.log(`Done. Created ${created} vocabulary entries, ${failed} failed.`)
  await prisma.$disconnect()
  await pool.end()
}

main().catch(async (err) => {
  console.error(err)
  await prisma.$disconnect()
  await pool.end()
  process.exit(1)
})
