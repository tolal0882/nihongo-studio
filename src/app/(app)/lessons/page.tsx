import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth'
import Link from 'next/link'

const LEVELS = ['ZERO','N5','N4','N3','N2','N1','ADVANCED'] as const

export default async function LessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>
}) {
  const { level } = await searchParams
  const session = await auth()
  const userId = session?.user?.id
  const userLevel = (session?.user?.currentLevel as any) ?? 'N5'
  const selectedLevel = (LEVELS.includes(level as any) ? level : userLevel) as typeof LEVELS[number]

  const [courses, completedLessons] = await Promise.all([
    prisma.course.findMany({
      where: { level: selectedLevel, isPublished: true },
      orderBy: { order: 'asc' },
      include: {
        lessons: {
          where: { isPublished: true },
          orderBy: { order: 'asc' },
          select: { id: true, title: true, level: true, xpReward: true, order: true },
        },
      },
    }),
    userId ? prisma.lessonProgress.findMany({
      where: { userId, completed: true },
      select: { lessonId: true },
    }) : Promise.resolve([]),
  ])

  const completedIds = new Set(completedLessons.map(l => l.lessonId))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>Lessons</h1>
        <p style={{ color: 'var(--color-text-2)', fontSize: '0.9rem' }}>Structured curriculum from absolute zero to advanced Japanese</p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {LEVELS.map(l => (
          <Link key={l} href={`/lessons?level=${l}`}
            className={`badge-jlpt badge-${l}`}
            style={{ textDecoration: 'none', padding: '6px 14px', cursor: 'pointer', fontWeight: 600, opacity: selectedLevel === l ? 1 : 0.55, transition: 'opacity 0.15s' }}>
            {l}
          </Link>
        ))}
      </div>

      {courses.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-3)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📖</div>
          <p>No courses published for {selectedLevel} yet. Run the seed script.</p>
        </div>
      ) : (
        courses.map(course => (
          <div key={course.id} className="card">
            <h2 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--color-text)' }}>{course.title}</h2>
            {course.description && <p style={{ color: 'var(--color-text-2)', fontSize: '0.9rem', marginBottom: '1rem' }}>{course.description}</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {course.lessons.map((lesson, idx) => {
                const done = completedIds.has(lesson.id)
                const isNext = !done && !completedIds.has(course.lessons[idx - 1]?.id ?? '') && idx === 0
                return (
                  <Link key={lesson.id} href={`/lessons/${lesson.id}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.875rem',
                      padding: '0.875rem 1rem', borderRadius: '10px', textDecoration: 'none',
                      background: done ? '#f0fdf4' : isNext ? 'var(--color-primary-50)' : 'var(--color-surface-2)',
                      border: `1px solid ${done ? '#bbf7d0' : isNext ? 'var(--color-primary-200)' : 'var(--color-border)'}`,
                      transition: 'all 0.15s',
                    }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: done ? '#22c55e' : isNext ? 'var(--color-primary-600)' : 'var(--color-surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: done || isNext ? 'white' : 'var(--color-text-3)', fontSize: '0.85rem', fontWeight: 700, flexShrink: 0 }}>
                      {done ? '✓' : lesson.order}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: done ? '#15803d' : isNext ? 'var(--color-primary-700)' : 'var(--color-text)', fontSize: '0.95rem' }}>{lesson.title}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700 }}>+{lesson.xpReward} XP</span>
                      {isNext && <span style={{ fontSize: '0.75rem', background: 'var(--color-primary-600)', color: 'white', padding: '2px 8px', borderRadius: '9999px', fontWeight: 600 }}>Next</span>}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
