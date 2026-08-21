import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import { generateRecommendations } from '@/lib/recommendation/engine'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const userId = session.user.id
  const userLevel = (session.user.currentLevel as any) ?? 'N5'

  const [profile, reviewCount, learnedCount, recommendations] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.userVocabulary.count({
      where: {
        userId,
        status: { in: ['LEARNING', 'REVIEW'] },
        OR: [{ nextReviewAt: null }, { nextReviewAt: { lte: new Date() } }],
      },
    }),
    prisma.userVocabulary.count({ where: { userId, status: { in: ['KNOWN', 'MASTERED'] } } }),
    generateRecommendations({ userId, userLevel, limit: 4 }),
  ])

  const dailyProgress = Math.min(100, ((profile?.totalStudyMinutes ?? 0) % (profile?.dailyGoalMinutes ?? 15)) / (profile?.dailyGoalMinutes ?? 15) * 100)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.25rem' }}>
            {getGreeting()}, {session.user.name?.split(' ')[0] ?? 'Learner'} 👋
          </h1>
          <p style={{ color: 'var(--color-text-2)' }}>Keep up the momentum — every word counts.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
          <span className="xp-badge">⚡ {profile?.xp ?? 0} XP</span>
          {(profile?.currentStreak ?? 0) > 0 && <span className="streak-badge">🔥 {profile?.currentStreak} day streak</span>}
          <span className={`badge-jlpt badge-${userLevel}`}>{userLevel}</span>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Words learned', value: learnedCount, icon: '📝', color: '#22c55e' },
          { label: 'Due for review', value: reviewCount, icon: '🔁', color: '#f59e0b' },
          { label: 'Study minutes', value: profile?.totalStudyMinutes ?? 0, icon: '⏱️', color: '#6366f1' },
          { label: 'Current streak', value: `${profile?.currentStreak ?? 0}d`, icon: '🔥', color: '#ef4444' },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ textAlign: 'center', padding: '1.25rem 1rem' }}>
            <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-3)', marginTop: '0.25rem' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Daily goal */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Today&apos;s goal</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-2)' }}>{Math.round(dailyProgress)}% · {profile?.dailyGoalMinutes} min</span>
        </div>
        <div className="progress-bar"><div className="progress-fill" style={{ width: `${dailyProgress}%` }} /></div>
      </div>

      {/* Main actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {/* Continue learning */}
        {recommendations.nextLesson && (
          <Link href={`/lessons/${recommendations.nextLesson.id}`} className="card card-interactive" style={{ display: 'block', textDecoration: 'none', borderLeft: '4px solid var(--color-primary-500)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📖</span>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary-600)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Continue Learning</div>
                <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>{recommendations.nextLesson.title}</div>
              </div>
            </div>
            <span className={`badge-jlpt badge-${recommendations.nextLesson.level}`}>{recommendations.nextLesson.level}</span>
          </Link>
        )}

        {/* Review */}
        {reviewCount > 0 && (
          <Link href="/practice?mode=review" className="card card-interactive" style={{ display: 'block', textDecoration: 'none', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🔁</span>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Review Due</div>
                <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>{reviewCount} words waiting</div>
              </div>
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-2)' }}>Tap to review now</div>
          </Link>
        )}
      </div>

      {/* Recommendations */}
      <div>
        <h2 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--color-text)' }}>Recommended for you</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
          {recommendations.learnWords.map(word => (
            <Link key={word.id} href={`/vocabulary/${word.id}`} className="word-card" style={{ textDecoration: 'none' }}>
              <div className="text-kanji" style={{ fontSize: '1.5rem' }}>{word.kanji ?? word.reading}</div>
              <div className="text-kana" style={{ fontSize: '0.9rem' }}>{word.reading}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-3)' }}>{word.meaning}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Grammar to learn */}
      {recommendations.grammarToLearn.length > 0 && (
        <div>
          <h2 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--color-text)' }}>Grammar to explore</h2>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {recommendations.grammarToLearn.map(g => (
              <Link key={g.id} href={`/grammar/${g.id}`}
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '0.75rem 1rem', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '2px', transition: 'all 0.15s' }}>
                <div style={{ fontFamily: 'Noto Sans JP, sans-serif', fontWeight: 700, color: 'var(--color-primary-700)' }}>{g.pattern}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-2)' }}>{g.meaning}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
