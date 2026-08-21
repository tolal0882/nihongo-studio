'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState } from 'react'

const NAV_ITEMS = [
  { href: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { href: '/lessons',   icon: '📚', label: 'Learn' },
  { href: '/dictionary', icon: '🔍', label: 'Dictionary' },
  { href: '/vocabulary', icon: '📝', label: 'Vocabulary' },
  { href: '/grammar',   icon: '⚙️',  label: 'Grammar' },
  { href: '/kanji',     icon: '漢',  label: 'Kanji' },
  { href: '/practice',  icon: '✏️',  label: 'Practice' },
  { href: '/tutor',     icon: '🤖',  label: 'AI Tutor' },
  { href: '/progress',  icon: '📊',  label: 'Progress' },
]

interface AppShellProps {
  children: React.ReactNode
  user: { name?: string | null; email?: string | null; currentLevel?: string }
}

export default function AppShell({ children, user }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/dictionary?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-surface-2)' }}>
      {/* Sidebar */}
      <aside style={{
        width: '240px', flexShrink: 0,
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
      }}
        className="hide-mobile">
        {/* Logo */}
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--color-border)' }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg, #818cf8, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: 'white', fontWeight: 700, fontFamily: 'Noto Sans JP, sans-serif' }}>日</div>
            <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text)', letterSpacing: '-0.02em' }}>Nihongo Studio</span>
          </Link>
        </div>

        {/* Level badge */}
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)' }}>
          <span className={`badge-jlpt badge-${user.currentLevel ?? 'N5'}`} style={{ fontSize: '0.7rem' }}>
            📍 {user.currentLevel ?? 'N5'} Level
          </span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0.75rem' }}>
          {NAV_ITEMS.map(item => (
            <Link key={item.href} href={item.href}
              className={`nav-link ${pathname?.startsWith(item.href) ? 'active' : ''}`}
              style={{ marginBottom: '2px' }}>
              <span style={{ fontSize: '1rem', width: '22px', textAlign: 'center', fontFamily: 'Noto Sans JP, sans-serif' }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #818cf8, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}>
              {user.name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name ?? 'Learner'}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
            </div>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/' })} className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center', color: 'var(--color-text-3)' }}>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar */}
        <header style={{
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          padding: '0.75rem 1.5rem',
          display: 'flex', alignItems: 'center', gap: '1rem',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          {/* Mobile menu */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="btn btn-ghost btn-icon show-mobile" aria-label="Menu">☰</button>

          {/* Search */}
          <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: '520px' }}>
            <div className="search-bar">
              <span style={{ color: 'var(--color-text-3)', flexShrink: 0 }}>🔍</span>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search Japanese, romaji, or English…"
                aria-label="Search dictionary"
              />
              {searchQuery && (
                <button type="submit" className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>Search</button>
              )}
            </div>
          </form>
        </header>

        {/* Content */}
        <main className="app-main" style={{ flex: 1, padding: '1.5rem', maxWidth: '1100px', width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 150, display: 'flex',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--color-surface)', width: '80%', maxWidth: '300px', height: '100%',
              display: 'flex', flexDirection: 'column', padding: '0.75rem', overflowY: 'auto',
            }}
          >
            <div style={{ padding: '0.5rem 0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg, #818cf8, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: 'white', fontWeight: 700, fontFamily: 'Noto Sans JP, sans-serif' }}>日</div>
              <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text)' }}>Nihongo Studio</span>
            </div>
            {NAV_ITEMS.map(item => (
              <Link key={item.href} href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`nav-link ${pathname?.startsWith(item.href) ? 'active' : ''}`}
                style={{ marginBottom: '2px' }}>
                <span style={{ fontSize: '1rem', width: '22px', textAlign: 'center', fontFamily: 'Noto Sans JP, sans-serif' }}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
            <button onClick={() => signOut({ callbackUrl: '/' })} className="btn btn-ghost btn-sm" style={{ marginTop: 'auto', justifyContent: 'center', color: 'var(--color-text-3)' }}>
              Sign out
            </button>
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        display: 'flex', justifyContent: 'space-around',
        padding: '0.5rem 0',
        zIndex: 100,
      }} className="show-mobile">
        {NAV_ITEMS.slice(0, 5).map(item => (
          <Link key={item.href} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', color: pathname?.startsWith(item.href) ? 'var(--color-primary-600)' : 'var(--color-text-3)', textDecoration: 'none', fontSize: '0.65rem', fontWeight: 600, padding: '4px 8px', borderRadius: '8px', minWidth: '48px' }}>
            <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
