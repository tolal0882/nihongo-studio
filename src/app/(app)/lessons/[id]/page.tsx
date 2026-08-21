import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import AudioButton from '@/components/audio/AudioButton'

export default async function LessonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      course: true,
      sections: { orderBy: { order: 'asc' } },
    },
  })

  if (!lesson) notFound()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '760px' }} className="animate-fade-in">
      <div>
        <Link href="/lessons" style={{ color: 'var(--color-text-3)', fontSize: '0.875rem', textDecoration: 'none' }}>← {lesson.course.title}</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{lesson.title}</h1>
          <span className={`badge-jlpt badge-${lesson.level}`}>{lesson.level}</span>
          <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700 }}>+{lesson.xpReward} XP</span>
        </div>
        {lesson.description && <p style={{ color: 'var(--color-text-2)', marginTop: '0.5rem' }}>{lesson.description}</p>}
      </div>

      {lesson.sections.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-3)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📖</div>
          <p>This lesson&apos;s content is being prepared. Check back soon!</p>
        </div>
      ) : (
        lesson.sections.map((section) => {
          const content = section.content as Record<string, unknown>
          return (
            <div key={section.id} className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.1rem' }}>
                  {(({ EXPLANATION: '📖', VOCABULARY: '📝', GRAMMAR: '⚙️', KANJI: '漢', LISTENING: '🔊', QUIZ: '✏️', REVIEW: '🔁', READING: '📖', SPEAKING: '🗣️', WRITING: '✏️' } as Record<string, string>)[section.type] ?? '📄')}
                </span>
                <span style={{ fontWeight: 700, textTransform: 'capitalize', fontSize: '0.9rem', color: 'var(--color-text-2)' }}>{section.type.toLowerCase()}</span>
                {section.title && <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>— {section.title}</span>}
              </div>

              {/* Explanation section */}
              {section.type === 'EXPLANATION' && (
                <div style={{ lineHeight: 1.8, color: 'var(--color-text)', fontSize: '0.95rem' }} dangerouslySetInnerHTML={{ __html: String(content.html ?? content.text ?? '') }} />
              )}

              {/* Vocabulary section */}
              {section.type === 'VOCABULARY' && Array.isArray(content.items) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {(content.items as Array<{ kanji?: string; reading: string; romaji: string; meaning: string }>).map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1rem', background: 'var(--color-surface-2)', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'baseline' }}>
                        <span style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5rem', fontWeight: 700 }}>{item.kanji ?? item.reading}</span>
                        {item.kanji && <span style={{ color: 'var(--color-text-2)', fontSize: '0.9rem', fontFamily: 'Noto Sans JP, sans-serif' }}>{item.reading}</span>}
                        <span style={{ color: 'var(--color-text-3)', fontSize: '0.85rem', fontStyle: 'italic' }}>{item.romaji}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <span style={{ color: 'var(--color-text)' }}>{item.meaning}</span>
                        <AudioButton text={item.reading} size="sm" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Grammar section */}
              {section.type === 'GRAMMAR' && (
                <div>
                  {!!content.pattern && <div style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary-700)', marginBottom: '0.5rem' }}>{String(content.pattern)}</div>}
                  {!!content.meaning && <div style={{ fontSize: '1rem', color: 'var(--color-text)', marginBottom: '0.75rem' }}>{String(content.meaning)}</div>}
                  {!!content.formation && (
                    <div style={{ background: 'var(--color-surface-2)', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.75rem', fontFamily: 'Noto Sans JP, sans-serif', fontWeight: 600 }}>
                      {String(content.formation)}
                    </div>
                  )}
                  {Array.isArray(content.examples) && (content.examples as Array<{ ja: string; en: string }>).map((ex, i) => (
                    <div key={i} style={{ padding: '0.75rem', background: 'var(--color-surface-2)', borderRadius: '8px', marginBottom: '0.5rem' }}>
                      <div style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>{ex.ja}</div>
                      <div style={{ color: 'var(--color-text-2)', fontSize: '0.875rem', marginTop: '2px' }}>{ex.en}</div>
                    </div>
                  ))}
                </div>
              )}


            </div>
          )
        })
      )}

      {/* Complete button */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
        <Link href="/lessons" className="btn btn-secondary">Back to lessons</Link>
        <form action={`/api/lessons/${lesson.id}/complete`} method="POST">
          <button type="submit" className="btn btn-primary">Complete lesson +{lesson.xpReward} XP</button>
        </form>
      </div>
    </div>
  )
}
