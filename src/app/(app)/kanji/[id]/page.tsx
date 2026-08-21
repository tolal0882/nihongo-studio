import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import AudioButton from '@/components/audio/AudioButton'

export default async function KanjiDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const kanji = await prisma.kanji.findUnique({
    where: { id },
    include: {
      readings: true,
      examples: { orderBy: { order: 'asc' } },
      strokes: { orderBy: { order: 'asc' } },
    },
  })

  if (!kanji) notFound()

  const onyomi = kanji.readings.filter(r => r.type === 'ON')
  const kunyomi = kanji.readings.filter(r => r.type === 'KUN')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '720px' }} className="animate-fade-in">
      <Link href="/kanji" style={{ color: 'var(--color-text-3)', fontSize: '0.875rem', textDecoration: 'none' }}>← Kanji</Link>

      {/* Header */}
      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Big character */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '6rem', lineHeight: 1, fontWeight: 700, color: 'var(--color-text)' }}>{kanji.character}</div>
            <AudioButton text={kanji.kunyomi[0] ?? kanji.onyomi[0] ?? kanji.character} size="sm" />
          </div>

          {/* Info */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <span className={`badge-jlpt badge-${kanji.jlptLevel}`}>{kanji.jlptLevel}</span>
              <span style={{ background: 'var(--color-surface-3)', color: 'var(--color-text-2)', padding: '3px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 500 }}>{kanji.strokeCount} strokes</span>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>Meanings</div>
              <div style={{ fontSize: '1rem', color: 'var(--color-text)' }}>{kanji.meanings.join(', ')}</div>
            </div>

            {onyomi.length > 0 && (
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>On-yomi (音読み)</div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {onyomi.map(r => (
                    <span key={r.id} style={{ fontFamily: 'Noto Sans JP, sans-serif', background: 'var(--color-surface-3)', padding: '3px 10px', borderRadius: '6px', fontSize: '1rem', fontWeight: 600 }}>{r.reading}</span>
                  ))}
                </div>
              </div>
            )}

            {kunyomi.length > 0 && (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Kun-yomi (訓読み)</div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {kunyomi.map(r => (
                    <span key={r.id} style={{ fontFamily: 'Noto Sans JP, sans-serif', background: 'var(--color-primary-50)', color: 'var(--color-primary-700)', padding: '3px 10px', borderRadius: '6px', fontSize: '1rem', fontWeight: 600 }}>{r.reading}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Examples */}
      {kanji.examples.length > 0 && (
        <div className="card">
          <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>Words using {kanji.character}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {kanji.examples.map(ex => (
              <div key={ex.id} style={{ padding: '0.875rem', background: 'var(--color-surface-2)', borderRadius: '10px' }}>
                <div style={{ fontFamily: 'Noto Sans JP, sans-serif', fontWeight: 700, fontSize: '1.15rem' }}>{ex.word}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-3)' }}>{ex.reading}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-2)', marginTop: '2px' }}>{ex.meaning}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stroke order placeholder */}
      {kanji.strokes.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '2rem', background: 'var(--color-surface-2)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✏️</div>
          <p style={{ color: 'var(--color-text-3)', fontSize: '0.9rem' }}>Stroke order animation coming soon.<br/>Import KANJIDIC data for full stroke sequences.</p>
        </div>
      )}
    </div>
  )
}
