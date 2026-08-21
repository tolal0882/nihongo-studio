'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const levels = [
  { id: 'ZERO', label: 'Complete Beginner', sublabel: 'I know no Japanese at all', emoji: '🌱' },
  { id: 'N5',   label: 'JLPT N5',          sublabel: 'I know some basics — hiragana, basic words', emoji: '🌿' },
  { id: 'N4',   label: 'JLPT N4',          sublabel: 'I can read simple texts and have basic conversation', emoji: '🌳' },
  { id: 'N3',   label: 'JLPT N3',          sublabel: 'I can handle everyday situations in Japanese', emoji: '🌲' },
  { id: 'N2',   label: 'JLPT N2',          sublabel: 'I can read newspapers and complex material', emoji: '⛰️' },
  { id: 'N1',   label: 'JLPT N1',          sublabel: 'Near-native reading and listening ability', emoji: '🏔️' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [selected, setSelected] = useState('ZERO')
  const [loading, setLoading] = useState(false)

  const handleContinue = async () => {
    setLoading(true)
    try {
      await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentLevel: selected }),
      })
      router.push('/dashboard')
    } catch {
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '600px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎌</div>
          <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>What&apos;s your Japanese level?</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem' }}>We&apos;ll personalize your learning path and recommendations.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {levels.map(level => (
            <button key={level.id} onClick={() => setSelected(level.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                background: selected === level.id ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.1)',
                border: selected === level.id ? '2px solid white' : '2px solid rgba(255,255,255,0.2)',
                borderRadius: '14px', padding: '1rem 1.25rem',
                cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'left', width: '100%',
              }}>
              <span style={{ fontSize: '1.75rem', flexShrink: 0 }}>{level.emoji}</span>
              <div>
                <div style={{ fontWeight: 700, color: selected === level.id ? '#312e81' : 'white', fontSize: '1rem' }}>{level.label}</div>
                <div style={{ fontSize: '0.85rem', color: selected === level.id ? '#6366f1' : 'rgba(255,255,255,0.65)', marginTop: '2px' }}>{level.sublabel}</div>
              </div>
              {selected === level.id && (
                <div style={{ marginLeft: 'auto', color: '#4338ca', fontSize: '1.25rem', flexShrink: 0 }}>✓</div>
              )}
            </button>
          ))}
        </div>

        <button onClick={handleContinue} disabled={loading} className="btn btn-lg"
          style={{ width: '100%', marginTop: '2rem', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#7c2d12', fontWeight: 700, justifyContent: 'center' }}>
          {loading ? 'Setting up...' : 'Start Learning →'}
        </button>
      </div>
    </div>
  )
}
