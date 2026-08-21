import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'

const LEVELS = ['ZERO','N5','N4','N3','N2','N1','ADVANCED'] as const

export default async function VocabularyPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>
}) {
  const { level } = await searchParams
  const selectedLevel = (LEVELS as readonly string[]).includes(level ?? '')
    ? (level as typeof LEVELS[number])
    : 'N5'

  const vocabulary = await prisma.vocabulary.findMany({
    where: { jlptLevel: selectedLevel },
    orderBy: { frequency: 'asc' },
    include: { meanings: { take: 1, orderBy: { order: 'asc' } } },
    take: 80,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>Vocabulary</h1>
        <p style={{ color: 'var(--color-text-2)', fontSize: '0.9rem' }}>Browse words organized by JLPT level</p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {LEVELS.map(l => (
          <Link key={l} href={`/vocabulary?level=${l}`}
            className={`badge-jlpt badge-${l}`}
            style={{ textDecoration: 'none', padding: '6px 14px', cursor: 'pointer', fontWeight: 600, opacity: selectedLevel === l ? 1 : 0.55, transition: 'opacity 0.15s' }}>
            {l}
          </Link>
        ))}
      </div>

      {vocabulary.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-3)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📝</div>
          <p>No vocabulary yet for {selectedLevel}. Run the import script to populate.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
          {vocabulary.map(v => (
            <Link key={v.id} href={`/vocabulary/${v.id}`} className="card card-interactive" style={{ display: 'flex', flexDirection: 'column', padding: '1rem', textDecoration: 'none' }}>
              <div style={{ fontFamily: 'Noto Sans JP, sans-serif', fontWeight: 700, fontSize: '1.3rem', color: 'var(--color-text)' }}>{v.kanji ?? v.primaryReading}</div>
              {v.kanji && <div style={{ fontSize: '0.8rem', color: 'var(--color-text-3)', marginTop: '2px' }}>{v.primaryReading}</div>}
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-2)', marginTop: '0.375rem' }}>{v.meanings[0]?.meaning}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
