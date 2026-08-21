import Link from 'next/link'

export default function HomePage() {
  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)' }}>
      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'linear-gradient(135deg, #818cf8, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
            日
          </div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>Nihongo Studio</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/sign-in" className="btn btn-ghost" style={{ color: 'rgba(255,255,255,0.8)' }}>Sign in</Link>
          <Link href="/sign-up" className="btn btn-primary" style={{ background: 'white', color: '#4338ca' }}>Start for free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: '800px', margin: '0 auto', padding: '5rem 2rem 3rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '9999px', padding: '6px 16px', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.2)' }}>
          <span style={{ color: '#fbbf24', fontSize: '0.8rem', fontWeight: 600 }}>✦ NEW</span>
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>AI-powered Japanese tutor now available</span>
        </div>

        <h1 style={{ color: 'white', fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '1.5rem' }}>
          Learn Japanese
          <span style={{ display: 'block', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>from zero to fluent.</span>
        </h1>

        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.2rem', lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
          Search Japanese in any form — romaji, hiragana, kanji, or English. Understand it. Hear it. Practice it. Get AI guidance tailored to your exact level.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/sign-up" className="btn btn-lg" style={{ background: 'white', color: '#4338ca', fontWeight: 700, fontSize: '1.05rem' }}>
            Start Learning Free →
          </Link>
          <Link href="/dictionary" className="btn btn-lg btn-ghost" style={{ color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
            Try the Dictionary
          </Link>
        </div>
      </section>

      {/* Search Demo */}
      <section style={{ maxWidth: '700px', margin: '2rem auto', padding: '0 2rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '20px', padding: '2rem' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.1em', marginBottom: '1rem', textTransform: 'uppercase' }}>Try searching for any of these:</p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {['taberu', 'たべる', '食べる', 'to eat', 'nomu', '学校'].map(term => (
              <Link key={term} href={`/dictionary?q=${encodeURIComponent(term)}`}
                style={{ background: 'rgba(255,255,255,0.12)', color: 'white', padding: '8px 16px', borderRadius: '9999px', fontSize: '0.95rem', fontFamily: 'Noto Sans JP, sans-serif', border: '1px solid rgba(255,255,255,0.2)', textDecoration: 'none', transition: 'all 0.15s' }}>
                {term}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ maxWidth: '1100px', margin: '4rem auto', padding: '0 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {[
            { icon: '🔍', title: 'Universal Search', desc: 'Search in romaji, hiragana, katakana, kanji, or English — all roads lead to the same word.' },
            { icon: '📚', title: 'Structured Curriculum', desc: 'Level ZERO through N1 and beyond. Lessons, vocabulary, grammar, and kanji — all connected.' },
            { icon: '🤖', title: 'AI Japanese Tutor', desc: 'Ask anything. Get corrections, grammar explanations, and personalized guidance from Claude.' },
            { icon: '🔊', title: 'Native Audio', desc: 'Hear every word and sentence in authentic Japanese. Click to listen on any word.' },
            { icon: '⚡', title: 'Spaced Repetition', desc: 'Scientific review scheduling (SM-2) ensures you never forget what you learn.' },
            { icon: '📊', title: 'Smart Recommendations', desc: 'Your next lesson, words, and grammar — personalized to your current level and weaknesses.' },
          ].map(f => (
            <div key={f.title} style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px', padding: '1.5rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{f.icon}</div>
              <h3 style={{ color: 'white', fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.5rem' }}>{f.title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: 'center', padding: '4rem 2rem 6rem' }}>
        <h2 style={{ color: 'white', fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>Ready to start your Japanese journey?</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '2rem' }}>Join thousands of learners progressing from absolute beginner to advanced.</p>
        <Link href="/sign-up" className="btn btn-lg" style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#7c2d12', fontWeight: 700, fontSize: '1.05rem' }}>
          Create Free Account →
        </Link>
      </section>
    </main>
  )
}
