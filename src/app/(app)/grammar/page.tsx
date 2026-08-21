import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'

const LEVELS = ['ZERO','N5','N4','N3','N2','N1','ADVANCED'] as const

export default async function GrammarPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>
}) {
  const { level } = await searchParams
  const selectedLevel = (LEVELS.includes(level as any) ? level : 'N5') as typeof LEVELS[number]

  const grammar = await prisma.grammar.findMany({
    where: { jlptLevel: selectedLevel },
    orderBy: { order: 'asc' },
    include: { examples: { take: 1 } },
    take: 50,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>Grammar</h1>
        <p style={{ color: 'var(--color-text-2)', fontSize: '0.9rem' }}>Browse grammar patterns organized by JLPT level</p>
      </div>

      {/* Level filter */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {LEVELS.map(l => (
          <Link key={l} href={`/grammar?level=${l}`}
            className={`badge-jlpt badge-${l}`}
            style={{ textDecoration: 'none', padding: '6px 14px', cursor: 'pointer', fontWeight: 600, opacity: selectedLevel === l ? 1 : 0.55, transition: 'opacity 0.15s' }}>
            {l}
          </Link>
        ))}
      </div>

      {grammar.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-3)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📚</div>
          <p>No grammar patterns yet for {selectedLevel}. Run the seed script to populate.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {grammar.map(g => (
            <Link key={g.id} href={`/grammar/${g.id}`} className="card card-interactive" style={{ display: 'block', textDecoration: 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-primary-700)' }}>{g.pattern}</div>
                <span className={`badge-jlpt badge-${g.jlptLevel}`}>{g.jlptLevel}</span>
              </div>
              <div style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.375rem' }}>{g.meaning}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-3)', fontStyle: 'italic' }}>{g.formation}</div>
              {g.examples[0] && (
                <div style={{ marginTop: '0.75rem', padding: '0.625rem', background: 'var(--color-surface-2)', borderRadius: '8px', fontSize: '0.875rem' }}>
                  <div style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>{g.examples[0].japanese}</div>
                  <div style={{ color: 'var(--color-text-3)', marginTop: '2px' }}>{g.examples[0].english}</div>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
