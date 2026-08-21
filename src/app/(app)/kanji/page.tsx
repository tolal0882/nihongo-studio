import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'

const LEVELS = ['ZERO','N5','N4','N3','N2','N1','ADVANCED'] as const

export default async function KanjiPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>
}) {
  const { level } = await searchParams
  const selectedLevel = (LEVELS.includes(level as any) ? level : 'N5') as typeof LEVELS[number]

  const kanji = await prisma.kanji.findMany({
    where: { jlptLevel: selectedLevel },
    orderBy: { frequency: 'asc' },
    take: 80,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>Kanji</h1>
        <p style={{ color: 'var(--color-text-2)', fontSize: '0.9rem' }}>Browse and learn kanji organized by JLPT level</p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {LEVELS.map(l => (
          <Link key={l} href={`/kanji?level=${l}`}
            className={`badge-jlpt badge-${l}`}
            style={{ textDecoration: 'none', padding: '6px 14px', cursor: 'pointer', fontWeight: 600, opacity: selectedLevel === l ? 1 : 0.55, transition: 'opacity 0.15s' }}>
            {l}
          </Link>
        ))}
      </div>

      {kanji.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-3)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>漢</div>
          <p>No kanji yet for {selectedLevel}. Run the seed script to populate.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem' }}>
          {kanji.map(k => (
            <Link key={k.id} href={`/kanji/${k.id}`} className="card card-interactive" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1.25rem 0.75rem', textDecoration: 'none' }}>
              <div style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '2.25rem', fontWeight: 700, lineHeight: 1, marginBottom: '0.5rem', color: 'var(--color-text)' }}>{k.character}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-2)', fontWeight: 600, marginBottom: '0.25rem' }}>{k.meanings[0]}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-3)' }}>{k.strokeCount} strokes</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
