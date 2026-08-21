import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import AudioButton from '@/components/audio/AudioButton'
import { generateRecommendations } from '@/lib/recommendation/engine'

export default async function VocabularyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const userId = session?.user?.id
  const userLevel = (session?.user?.currentLevel as any) ?? 'N5'

  const vocabulary = await prisma.vocabulary.findUnique({
    where: { id },
    include: {
      meanings: true,
      examples: { orderBy: { order: 'asc' } },
      audioSources: { take: 1 },
    },
  })

  if (!vocabulary) notFound()

  const [userProgress, recommendations] = await Promise.all([
    userId ? prisma.userVocabulary.findUnique({
      where: { userId_vocabularyId: { userId, vocabularyId: id } },
    }) : null,
    userId ? generateRecommendations({ userId, userLevel, searchedVocabularyId: id, limit: 5 }) : null,
  ])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '720px' }} className="animate-fade-in">
      {/* Back */}
      <Link href="/dictionary" style={{ color: 'var(--color-text-3)', fontSize: '0.875rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
        ← Back to Dictionary
      </Link>

      {/* Word header */}
      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <div className="text-kanji">{vocabulary.kanji ?? vocabulary.primaryReading}</div>
            {vocabulary.kanji && <div className="text-kana" style={{ marginTop: '0.25rem' }}>{vocabulary.primaryReading}</div>}
            <div className="text-romaji" style={{ marginTop: '0.125rem' }}>{vocabulary.romaji}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
            <span className={`badge-jlpt badge-${vocabulary.jlptLevel}`}>{vocabulary.jlptLevel}</span>
            {vocabulary.isCommon && <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: '9999px', fontWeight: 600 }}>Common word</span>}
          </div>
        </div>

        {/* Meanings */}
        <div style={{ marginBottom: '1rem' }}>
          {vocabulary.meanings.map((m, i) => (
            <div key={m.id} style={{ padding: '0.5rem 0', borderBottom: i < vocabulary.meanings.length - 1 ? '1px solid var(--color-border)' : 'none', fontSize: '1.05rem', color: 'var(--color-text)' }}>
              <span style={{ color: 'var(--color-text-3)', fontSize: '0.8rem', marginRight: '0.5rem' }}>{i + 1}.</span>
              {m.meaning}
            </div>
          ))}
        </div>

        {/* Meta */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {vocabulary.partOfSpeech.map(pos => (
            <span key={pos} style={{ background: 'var(--color-surface-3)', color: 'var(--color-text-2)', padding: '3px 10px', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 500 }}>{pos}</span>
          ))}
        </div>

        {/* Audio + Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <AudioButton text={vocabulary.primaryReading} audioUrl={vocabulary.audioSources[0]?.url} />
          {userId && (
            <AddToReviewButton vocabularyId={vocabulary.id} currentStatus={userProgress?.status} />
          )}
        </div>
      </div>

      {/* Examples */}
      {vocabulary.examples.length > 0 && (
        <div className="card">
          <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>Example sentences</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {vocabulary.examples.map(ex => (
              <div key={ex.id} style={{ padding: '1rem', background: 'var(--color-surface-2)', borderRadius: '10px' }}>
                <div style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.05rem', marginBottom: '0.25rem' }}>{ex.japanese}</div>
                {ex.romaji && <div style={{ fontSize: '0.85rem', color: 'var(--color-text-3)', fontStyle: 'italic', marginBottom: '0.25rem' }}>{ex.romaji}</div>}
                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-2)' }}>{ex.english}</div>
                <div style={{ marginTop: '0.5rem' }}>
                  <AudioButton text={ex.japanese} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations && (
        <>
          {recommendations.relatedVocabulary.length > 0 && (
            <div className="card">
              <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>Related vocabulary</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
                {recommendations.relatedVocabulary.map(w => (
                  <Link key={w.id} href={`/vocabulary/${w.id}`} className="word-card" style={{ textDecoration: 'none' }}>
                    <div style={{ fontFamily: 'Noto Sans JP, sans-serif', fontWeight: 700, fontSize: '1.2rem' }}>{w.kanji ?? w.reading}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-3)' }}>{w.reading}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-2)', marginTop: '2px' }}>{w.meaning}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {recommendations.nextLesson && (
            <div className="card" style={{ background: 'var(--color-primary-50)', borderColor: 'var(--color-primary-200)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary-600)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Recommended lesson</div>
              <Link href={`/lessons/${recommendations.nextLesson.id}`} style={{ fontWeight: 700, color: 'var(--color-primary-700)', textDecoration: 'none', fontSize: '1.05rem' }}>
                {recommendations.nextLesson.title} →
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Client component for add-to-review button
function AddToReviewButton({ vocabularyId, currentStatus }: { vocabularyId: string; currentStatus?: string }) {
  'use client'
  // This is a placeholder — in production would be a client component
  return (
    <form action={`/api/vocabulary/${vocabularyId}/learn`} method="POST">
      <button type="submit" className="btn btn-secondary btn-sm">
        {currentStatus ? '✓ In your list' : '+ Add to review'}
      </button>
    </form>
  )
}
