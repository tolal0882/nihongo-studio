import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import AudioButton from '@/components/audio/AudioButton'

export default async function GrammarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()

  const grammar = await prisma.grammar.findUnique({
    where: { id },
    include: {
      examples: { orderBy: { order: 'asc' } },
      relatedGrammar: {
        include: { grammarB: { select: { id: true, pattern: true, meaning: true } } },
      },
      prerequisites: {
        include: { prerequisite: { select: { id: true, pattern: true, meaning: true } } },
      },
    },
  })

  if (!grammar) notFound()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '720px' }} className="animate-fade-in">
      <Link href="/grammar" style={{ color: 'var(--color-text-3)', fontSize: '0.875rem', textDecoration: 'none' }}>← Grammar</Link>

      {/* Header */}
      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '2.25rem', fontWeight: 800, color: 'var(--color-primary-700)' }}>{grammar.pattern}</div>
            <div style={{ fontSize: '1.1rem', color: 'var(--color-text)', marginTop: '0.25rem' }}>{grammar.meaning}</div>
          </div>
          <span className={`badge-jlpt badge-${grammar.jlptLevel}`}>{grammar.jlptLevel}</span>
        </div>

        {/* Formation */}
        <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>Formation</div>
          <div style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)' }}>{grammar.formation}</div>
        </div>

        {/* Usage */}
        {grammar.usage && (
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>Usage</div>
            <p style={{ color: 'var(--color-text-2)', fontSize: '0.95rem', lineHeight: 1.7 }}>{grammar.usage}</p>
          </div>
        )}

        {/* Common mistakes */}
        {grammar.commonMistakes && (
          <div style={{ marginTop: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>⚠️ Common mistakes</div>
            <p style={{ color: '#7f1d1d', fontSize: '0.9rem' }}>{grammar.commonMistakes}</p>
          </div>
        )}
      </div>

      {/* Examples */}
      {grammar.examples.length > 0 && (
        <div className="card">
          <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>Examples</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {grammar.examples.map(ex => (
              <div key={ex.id} style={{ padding: '1rem', background: 'var(--color-surface-2)', borderRadius: '10px' }}>
                <div style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.05rem', marginBottom: '0.25rem' }}>{ex.japanese}</div>
                {ex.romaji && <div style={{ fontSize: '0.85rem', color: 'var(--color-text-3)', fontStyle: 'italic', marginBottom: '0.25rem' }}>{ex.romaji}</div>}
                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-2)', marginBottom: '0.5rem' }}>{ex.english}</div>
                <AudioButton text={ex.japanese} size="sm" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prerequisites */}
      {grammar.prerequisites.length > 0 && (
        <div className="card">
          <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.75rem' }}>Prerequisites</h2>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {grammar.prerequisites.map(p => (
              <Link key={p.id} href={`/grammar/${p.prerequisite.id}`}
                style={{ background: 'var(--color-surface-3)', color: 'var(--color-text)', padding: '6px 14px', borderRadius: '9999px', textDecoration: 'none', fontFamily: 'Noto Sans JP, sans-serif', fontSize: '0.9rem', fontWeight: 600, border: '1px solid var(--color-border)' }}>
                {p.prerequisite.pattern}
                <span style={{ color: 'var(--color-text-3)', fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '0.8rem', marginLeft: '4px' }}>— {p.prerequisite.meaning}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Related grammar */}
      {grammar.relatedGrammar.length > 0 && (
        <div className="card">
          <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.75rem' }}>Related grammar</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {grammar.relatedGrammar.map(r => (
              <Link key={r.id} href={`/grammar/${r.grammarB.id}`} className="word-card" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none' }}>
                <span style={{ fontFamily: 'Noto Sans JP, sans-serif', fontWeight: 700, color: 'var(--color-primary-700)' }}>{r.grammarB.pattern}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-2)' }}>{r.grammarB.meaning}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
