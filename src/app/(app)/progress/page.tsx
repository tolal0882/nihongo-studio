import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'

export default async function ProgressPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const userId = session.user.id

  const [profile, vocabStats, kanjiStats, grammarStats] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.userVocabulary.groupBy({
      by: ['status'],
      where: { userId },
      _count: true,
    }),
    prisma.userKanji.groupBy({
      by: ['status'],
      where: { userId },
      _count: true,
    }),
    prisma.userGrammar.groupBy({
      by: ['status'],
      where: { userId },
      _count: true,
    }),
  ])

  const vocabTotal = vocabStats.reduce((a, b) => a + b._count, 0)
  const vocabMastered = vocabStats.filter(s => s.status === 'MASTERED' || s.status === 'KNOWN').reduce((a, b) => a + b._count, 0)

  const LEVEL_ORDER = ['ZERO', 'N5', 'N4', 'N3', 'N2', 'N1', 'ADVANCED']
  const levelIndex = LEVEL_ORDER.indexOf(profile?.currentLevel ?? 'N5')
  const levelProgress = levelIndex / (LEVEL_ORDER.length - 1) * 100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>Progress</h1>
        <p style={{ color: 'var(--color-text-2)', fontSize: '0.9rem' }}>Your Japanese learning journey so far</p>
      </div>

      {/* Level progress */}
      <div className="card">
        <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem' }}>Overall Level</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontWeight: 600 }}>{profile?.currentLevel ?? 'N5'}</span>
          <span style={{ color: 'var(--color-text-2)', fontSize: '0.875rem' }}>Target: {profile?.targetLevel ?? 'N4'}</span>
        </div>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '1rem' }}>
          {LEVEL_ORDER.map((l, i) => (
            <div key={l} style={{ flex: 1, height: 8, borderRadius: 4, background: i <= levelIndex ? 'var(--color-primary-500)' : 'var(--color-surface-3)', transition: 'background 0.3s' }} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {LEVEL_ORDER.map((l, i) => (
            <div key={l} style={{ fontSize: '0.65rem', color: i <= levelIndex ? 'var(--color-primary-600)' : 'var(--color-text-3)', fontWeight: i === levelIndex ? 700 : 400 }}>{l}</div>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'XP earned', value: profile?.xp ?? 0, icon: '⚡', color: '#f59e0b' },
          { label: 'Day streak', value: profile?.currentStreak ?? 0, icon: '🔥', color: '#ef4444' },
          { label: 'Study minutes', value: profile?.totalStudyMinutes ?? 0, icon: '⏱️', color: '#6366f1' },
          { label: 'Words mastered', value: vocabMastered, icon: '📝', color: '#22c55e' },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-3)', marginTop: '0.25rem' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Vocabulary mastery breakdown */}
      {vocabTotal > 0 && (
        <div className="card">
          <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>Vocabulary mastery ({vocabTotal} words)</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {[
              { status: 'MASTERED', label: 'Mastered', color: '#22c55e' },
              { status: 'KNOWN',    label: 'Known',    color: '#3b82f6' },
              { status: 'REVIEW',   label: 'In review', color: '#f59e0b' },
              { status: 'LEARNING', label: 'Learning',  color: '#8b5cf6' },
              { status: 'NEW',      label: 'New',       color: '#94a3b8' },
            ].map(({ status, label, color }) => {
              const count = vocabStats.find(s => s.status === status)?._count ?? 0
              const pct = vocabTotal > 0 ? (count / vocabTotal * 100) : 0
              return (
                <div key={status}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-2)' }}>{label}</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{count}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {vocabTotal === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-3)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🌱</div>
          <p>Start learning words to see your progress here!</p>
        </div>
      )}
    </div>
  )
}
