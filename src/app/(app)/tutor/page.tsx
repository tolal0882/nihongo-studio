'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  structured?: {
    answer?: string
    corrections?: Array<{ original: string; corrected: string; explanation: string }>
    vocabulary?: Array<{ word: string; reading: string; meaning: string }>
    grammar?: Array<{ pattern: string; meaning: string; example: string }>
    recommendations?: string[]
  }
}

export default function TutorPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string>()
  const [analyzerInput, setAnalyzerInput] = useState('')
  const [analysis, setAnalysis] = useState<{
    japanese: string
    romaji?: string
    english: string
    naturalness: number
    jlptEstimate: string
    corrections: Array<{ original: string; corrected: string; explanation: string }>
    vocabulary: Array<{ word: string; reading: string; meaning: string; jlpt: string }>
    grammar: Array<{ pattern: string; meaning: string; partInSentence?: string }>
    error?: string
  } | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [activeTab, setActiveTab] = useState<'tutor' | 'analyzer'>('tutor')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const res = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, conversationId, context: 'tutor' }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.error ?? 'AI tutor unavailable. Check your ANTHROPIC_API_KEY in .env.local.' }])
        return
      }

      if (data.conversationId) setConversationId(data.conversationId)
      const response = data.response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: typeof response.answer === 'string' ? response.answer : JSON.stringify(response),
        structured: response,
      }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const analyzesentence = async () => {
    if (!analyzerInput.trim() || analyzing) return
    setAnalyzing(true)
    setAnalysis(null)
    try {
      const res = await fetch('/api/ai/analyze-sentence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence: analyzerInput }),
      })
      const data = await res.json()
      setAnalysis(data.analysis)
    } catch {
      setAnalysis(null)
    } finally {
      setAnalyzing(false)
    }
  }

  const StarRating = ({ n }: { n: number }) => (
    <span>{Array.from({ length: 5 }, (_, i) => <span key={i} style={{ color: i < n ? '#fbbf24' : '#d1d5db' }}>★</span>)}</span>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '760px', height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>🤖 AI Japanese Tutor</h1>
        <p style={{ color: 'var(--color-text-2)', fontSize: '0.9rem' }}>Powered by Claude — ask anything, get corrections, or analyze a sentence.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--color-surface-3)', borderRadius: '12px', padding: '4px' }}>
        {(['tutor', 'analyzer'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: '0.5rem', borderRadius: '9px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
              background: activeTab === tab ? 'var(--color-surface)' : 'transparent',
              color: activeTab === tab ? 'var(--color-text)' : 'var(--color-text-3)',
              boxShadow: activeTab === tab ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s',
            }}>
            {tab === 'tutor' ? '💬 Tutor Chat' : '🔬 Sentence Analyzer'}
          </button>
        ))}
      </div>

      {/* Tutor Chat */}
      {activeTab === 'tutor' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '1rem' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎌</div>
                <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Ask your AI Sensei</h3>
                <p style={{ color: 'var(--color-text-2)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Type a Japanese sentence for correction, or ask any grammar question.</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                  {[
                    '私は日本に行くたい。',
                    'When do I use は vs が?',
                    'Explain て-form',
                    '今日は学校に行きました。',
                  ].map(q => (
                    <button key={q} onClick={() => setInput(q)}
                      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '9999px', padding: '8px 16px', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'Noto Sans JP, sans-serif', color: 'var(--color-text)', transition: 'all 0.15s' }}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {msg.role === 'assistant' && (
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #818cf8, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0, marginRight: '0.625rem', marginTop: '2px' }}>🤖</div>
                )}
                <div style={{
                  maxWidth: '80%',
                  background: msg.role === 'user' ? 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700))' : 'var(--color-surface)',
                  color: msg.role === 'user' ? 'white' : 'var(--color-text)',
                  borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  padding: '0.875rem 1rem',
                  border: msg.role === 'assistant' ? '1px solid var(--color-border)' : 'none',
                  boxShadow: 'var(--shadow-sm)',
                }}>
                  {/* Corrections */}
                  {msg.structured?.corrections && msg.structured.corrections.length > 0 && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      {msg.structured.corrections.map((c, ci) => (
                        <div key={ci} style={{ marginBottom: '0.5rem', padding: '0.75rem', background: 'var(--color-surface-2)', borderRadius: '8px' }}>
                          <div><span className="correction-incorrect">{c.original}</span></div>
                          <div>✅ <span className="correction-correct">{c.corrected}</span></div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-2)', marginTop: '0.25rem' }}>{c.explanation}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem', lineHeight: 1.6, fontFamily: 'Noto Sans JP, sans-serif' }}>{msg.content}</div>

                  {/* Vocab pills */}
                  {msg.structured?.vocabulary && msg.structured.vocabulary.length > 0 && (
                    <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                      {msg.structured.vocabulary.map((v, vi) => (
                        <span key={vi} style={{ background: 'var(--color-primary-50)', color: 'var(--color-primary-700)', borderRadius: '9999px', padding: '3px 10px', fontSize: '0.8rem', fontFamily: 'Noto Sans JP, sans-serif', fontWeight: 600 }}>
                          {v.word} <span style={{ fontWeight: 400, opacity: 0.7 }}>— {v.meaning}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', gap: '0.625rem' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #818cf8, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>🤖</div>
                <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '18px 18px 18px 4px', padding: '0.875rem 1rem', display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-text-3)', animation: `bounce 0.9s ${i * 0.15}s infinite` }} />)}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem 0' }}>
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
              placeholder="Type Japanese or English…"
              className="input" style={{ flex: 1, fontFamily: 'Noto Sans JP, sans-serif' }}
              disabled={loading} />
            <button onClick={sendMessage} disabled={loading || !input.trim()} className="btn btn-primary">
              {loading ? '…' : 'Send'}
            </button>
          </div>
        </div>
      )}

      {/* Sentence Analyzer */}
      {activeTab === 'analyzer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input value={analyzerInput} onChange={e => setAnalyzerInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && analyzesentence()}
              placeholder="Enter a Japanese sentence to analyze…"
              className="input" style={{ flex: 1, fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1rem' }} />
            <button onClick={analyzesentence} disabled={analyzing || !analyzerInput.trim()} className="btn btn-primary">
              {analyzing ? 'Analyzing…' : 'Analyze'}
            </button>
          </div>

          {!analysis && !analyzing && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-3)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔬</div>
              <p>Enter any Japanese sentence to get a full breakdown: vocabulary, grammar, particles, JLPT level, and naturalness score.</p>
              <button onClick={() => setAnalyzerInput('私は毎日日本語を勉強しています。')} style={{ marginTop: '1rem', background: 'var(--color-surface-3)', border: 'none', borderRadius: '9999px', padding: '8px 16px', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'Noto Sans JP, sans-serif' }}>
                Try: 私は毎日日本語を勉強しています。
              </button>
            </div>
          )}

          {analyzing && (
            <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ color: 'var(--color-text-2)' }}>Analyzing sentence…</div>
            </div>
          )}

          {analysis && !analyzing && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="animate-fade-in">
              {/* Main */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>{analysis.japanese}</div>
                {analysis.romaji && <div style={{ fontSize: '0.9rem', color: 'var(--color-text-3)', fontStyle: 'italic', marginBottom: '0.25rem' }}>{analysis.romaji}</div>}
                <div style={{ fontSize: '1rem', color: 'var(--color-text-2)', marginBottom: '1rem' }}>{analysis.english}</div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-3)', marginBottom: '2px' }}>Naturalness</div>
                    <StarRating n={analysis.naturalness} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-3)', marginBottom: '2px' }}>JLPT estimate</div>
                    <span className={`badge-jlpt badge-${analysis.jlptEstimate}`}>{analysis.jlptEstimate}</span>
                  </div>
                </div>
              </div>

              {/* Corrections */}
              {(analysis.corrections as unknown[])?.length > 0 && (
                <div className="card" style={{ background: '#fff7ed', borderColor: '#fed7aa' }}>
                  <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem', color: '#c2410c' }}>✏️ Corrections</h3>
                  {(analysis.corrections as Array<{ original: string; corrected: string; explanation: string }>).map((c, i) => (
                    <div key={i} style={{ marginBottom: '0.5rem' }}>
                      <span className="correction-incorrect">{c.original}</span> → <span className="correction-correct">{c.corrected}</span>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-2)', marginTop: '2px' }}>{c.explanation}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Vocabulary breakdown */}
              {(analysis.vocabulary as unknown[])?.length > 0 && (
                <div className="card">
                  <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem' }}>📝 Vocabulary</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {(analysis.vocabulary as Array<{ word: string; reading: string; meaning: string; jlpt: string }>).map((v, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'var(--color-surface-2)', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'baseline' }}>
                          <span style={{ fontFamily: 'Noto Sans JP, sans-serif', fontWeight: 700 }}>{v.word}</span>
                          <span style={{ color: 'var(--color-text-3)', fontSize: '0.85rem' }}>{v.reading}</span>
                          <span style={{ color: 'var(--color-text-2)', fontSize: '0.875rem' }}>{v.meaning}</span>
                        </div>
                        <span className={`badge-jlpt badge-${v.jlpt}`}>{v.jlpt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Grammar breakdown */}
              {(analysis.grammar as unknown[])?.length > 0 && (
                <div className="card">
                  <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem' }}>⚙️ Grammar</h3>
                  {(analysis.grammar as Array<{ pattern: string; meaning: string; partInSentence: string }>).map((g, i) => (
                    <div key={i} style={{ padding: '0.5rem', background: 'var(--color-surface-2)', borderRadius: '8px', marginBottom: '0.5rem' }}>
                      <span style={{ fontFamily: 'Noto Sans JP, sans-serif', fontWeight: 700, color: 'var(--color-primary-700)' }}>{g.pattern}</span>
                      <span style={{ color: 'var(--color-text-2)', fontSize: '0.875rem', marginLeft: '0.5rem' }}>— {g.meaning}</span>
                      {g.partInSentence && <div style={{ fontSize: '0.8rem', color: 'var(--color-text-3)', marginTop: '2px' }}>{g.partInSentence}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

