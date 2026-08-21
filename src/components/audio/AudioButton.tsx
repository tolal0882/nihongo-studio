'use client'

import { useState } from 'react'

interface AudioButtonProps {
  text: string
  audioUrl?: string | null
  size?: 'sm' | 'md'
}

export default function AudioButton({ text, audioUrl, size = 'md' }: AudioButtonProps) {
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState(false)

  const handlePlay = async () => {
    if (playing) return
    setError(false)

    // Try stored audio first
    if (audioUrl) {
      const audio = new Audio(audioUrl)
      setPlaying(true)
      audio.onended = () => setPlaying(false)
      audio.onerror = () => {
        setPlaying(false)
        playTTS()
      }
      audio.play().catch(() => { setPlaying(false); playTTS() })
      return
    }

    playTTS()
  }

  const playTTS = () => {
    if (!('speechSynthesis' in window)) {
      setError(true)
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ja-JP'
    utterance.rate = 0.9
    utterance.pitch = 1.1

    // Try to find a Japanese voice
    const voices = speechSynthesis.getVoices()
    const jaVoice = voices.find(v => v.lang === 'ja-JP' || v.lang.startsWith('ja'))
    if (jaVoice) utterance.voice = jaVoice

    utterance.onstart = () => setPlaying(true)
    utterance.onend = () => setPlaying(false)
    utterance.onerror = () => { setPlaying(false); setError(true) }

    speechSynthesis.speak(utterance)
  }

  if (error) {
    return <span style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>Audio unavailable</span>
  }

  return (
    <button onClick={handlePlay} disabled={playing}
      className={`audio-btn ${size === 'sm' ? 'btn-sm' : ''}`}
      aria-label={`Listen to ${text}`}
      style={{ opacity: playing ? 0.7 : 1 }}>
      {playing ? (
        <span style={{ display: 'inline-flex', gap: '2px', alignItems: 'center' }}>
          <span style={{ width: 3, height: 12, background: 'currentColor', borderRadius: 2, animation: 'bounce 0.6s infinite' }} />
          <span style={{ width: 3, height: 16, background: 'currentColor', borderRadius: 2, animation: 'bounce 0.6s infinite 0.1s' }} />
          <span style={{ width: 3, height: 10, background: 'currentColor', borderRadius: 2, animation: 'bounce 0.6s infinite 0.2s' }} />
        </span>
      ) : '🔊'}
      {size !== 'sm' && <span>{playing ? 'Playing…' : 'Listen'}</span>}
    </button>
  )
}
