'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface SearchResult {
  id: string
  type: 'vocabulary' | 'kanji' | 'grammar'
  score: number
  kanji?: string | null
  primaryReading?: string
  romaji?: string
  meanings: string[]
  jlptLevel: string
  partOfSpeech?: string[]
  isCommon?: boolean
}

export default function DictionaryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') ?? ''

  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setSearched(false); return }
    setLoading(true)
    setSearched(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data.results ?? [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialQuery) doSearch(initialQuery)
    inputRef.current?.focus()
  }, [initialQuery, doSearch])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/dictionary?q=${encodeURIComponent(query.trim())}`, { scroll: false })
      doSearch(query.trim())
    }
  }

  const SUGGESTIONS = ['食べる', 'のむ', 'gakkou', '学校', 'kawaii', 'ありがとう', '日本語', 'sensei']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Dictionary</h1>
        <p style={{ color: 'var(--color-text-2)', fontSize: '0.9rem' }}>Search in Japanese, romaji, hiragana, katakana, or English</p>
      </div>

      {/* Big search */}
      <form onSubmit={handleSearch}>
        <div className="search-bar" style={{ borderRadius: '16px', padding: '0.75rem 1.25rem' }}>
          <span style={{ fontSize: '1.25rem', color: 'var(--color-text-3)' }}>🔍</span>
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
            placeholder="taberu・食べる・たべる・to eat…" style={{ fontSize: '1.15rem' }}
            aria-label="Search Japanese dictionary" />
          {query && (
            <button type="button" onClick={() => { setQuery(''); setResults([]); setSearched(false) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-3)', fontSize: '1.2rem', padding: '0 4px' }}>×</button>
          )}
          <button type="submit" className="btn btn-primary btn-sm" disabled={!query.trim()}>Search</button>
        </div>
      </form>

      {/* Suggestions */}
      {!searched && (
        <div>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-3)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Popular searches</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => { setQuery(s); doSearch(s); router.push(`/dictionary?q=${encodeURIComponent(s)}`, { scroll: false }) }}
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '9999px', padding: '6px 16px', cursor: 'pointer', fontFamily: 'Noto Sans JP, sans-serif', fontSize: '0.9rem', color: 'var(--color-text)', transition: 'all 0.15s' }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1,2,3].map(i => (
            <div key={i} className="card" style={{ height: '100px' }}>
              <div className="skeleton" style={{ height: '1.5rem', width: '40%', marginBottom: '0.5rem' }} />
              <div className="skeleton" style={{ height: '1rem', width: '60%' }} />
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {searched && !loading && results.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>No results for &ldquo;{query}&rdquo;</h3>
          <p style={{ color: 'var(--color-text-2)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Try a different spelling, or ask the AI Tutor for help.
          </p>
          <Link href={`/tutor?q=${encodeURIComponent(query)}`} className="btn btn-secondary btn-sm">Ask AI Tutor →</Link>
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-3)' }}>{results.length} results for &ldquo;{query}&rdquo;</p>
          {results.map(r => (
            <Link key={r.id} href={`/${r.type === 'vocabulary' ? 'vocabulary' : r.type}/${r.id}`}
              className="card card-interactive" style={{ display: 'block', textDecoration: 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.375rem' }}>
                    <span className="text-kanji" style={{ fontSize: '1.75rem' }}>{r.kanji ?? r.primaryReading}</span>
                    {r.kanji && <span className="text-kana">{r.primaryReading}</span>}
                    {r.romaji && <span className="text-romaji">{r.romaji}</span>}
                  </div>
                  <div style={{ color: 'var(--color-text)', fontWeight: 500 }}>{r.meanings.slice(0, 3).join('; ')}</div>
                  {r.partOfSpeech && r.partOfSpeech.length > 0 && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-3)', marginTop: '0.25rem' }}>{r.partOfSpeech.join(', ')}</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flexShrink: 0 }}>
                  <span className={`badge-jlpt badge-${r.jlptLevel}`}>{r.jlptLevel}</span>
                  {r.isCommon && <span style={{ fontSize: '0.7rem', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '9999px', fontWeight: 600 }}>common</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
