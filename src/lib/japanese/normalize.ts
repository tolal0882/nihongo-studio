// Japanese text normalization and input detection utilities

/**
 * Detect the type of Japanese input
 */
export type InputType = 'japanese' | 'romaji' | 'english' | 'mixed'

const HIRAGANA_RANGE = /[\u3040-\u309F]/
const KATAKANA_RANGE = /[\u30A0-\u30FF]/
const KANJI_RANGE = /[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]/
const ROMAJI_PATTERN = /^[a-zA-Z\s\-']+$/

export function detectInputType(input: string): InputType {
  const trimmed = input.trim()
  if (!trimmed) return 'english'

  const hasJapanese =
    HIRAGANA_RANGE.test(trimmed) ||
    KATAKANA_RANGE.test(trimmed) ||
    KANJI_RANGE.test(trimmed)

  if (hasJapanese) {
    const hasLatin = /[a-zA-Z]/.test(trimmed)
    return hasLatin ? 'mixed' : 'japanese'
  }

  if (ROMAJI_PATTERN.test(trimmed)) {
    // Check if it could be romaji (contains vowels in romaji patterns)
    if (/[aeiouAEIOU]/.test(trimmed) && isLikelyRomaji(trimmed)) {
      return 'romaji'
    }
  }

  return 'english'
}

/**
 * Heuristic: common romaji patterns suggest Japanese romaji input
 */
function isLikelyRomaji(input: string): boolean {
  const lower = input.toLowerCase()
  // Common romaji patterns
  const romajiPatterns = [
    /[bcdfghjklmnprstwy][aeiou]/,  // consonant + vowel
    /^[aeiou]/,                     // starts with vowel
    /shi|chi|tsu|zu|su|ku|fu|nu|mu|ru|yu|wo|wa|ni|ha|he|ho/,
    /kk|tt|pp|ss|nn|mm/,           // doubled consonants (geminate)
    /ou$|uu$|ii$/,                  // long vowels
  ]
  return romajiPatterns.some(p => p.test(lower))
}

export function isHiragana(char: string): boolean {
  return HIRAGANA_RANGE.test(char)
}

export function isKatakana(char: string): boolean {
  return KATAKANA_RANGE.test(char)
}

export function isKanji(char: string): boolean {
  return KANJI_RANGE.test(char)
}

/**
 * Convert katakana to hiragana
 */
export function katakanaToHiragana(str: string): string {
  return str.replace(/[\u30A0-\u30F6]/g, ch =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  )
}

/**
 * Convert hiragana to katakana
 */
export function hiraganaToKatakana(str: string): string {
  return str.replace(/[\u3041-\u3096]/g, ch =>
    String.fromCharCode(ch.charCodeAt(0) + 0x60)
  )
}

/**
 * Normalize romaji variants (handles common spelling differences)
 */
export function normalizeRomaji(input: string): string {
  let normalized = input.toLowerCase().trim()

  // Common variant normalizations
  const variants: [RegExp, string][] = [
    [/ō/g, 'ou'],
    [/ū/g, 'uu'],
    [/ā/g, 'aa'],
    [/ī/g, 'ii'],
    [/ē/g, 'ee'],
    [/sh/g, 'sh'],    // keep
    [/ch/g, 'ch'],    // keep
    [/tchi/g, 'cchi'],
    [/cci/g, 'cchi'],
    [/ti$/g, 'chi'],  // ti → chi (nihon-shiki → hepburn)
    [/si$/g, 'shi'],
    [/tu$/g, 'tsu'],
    [/hu$/g, 'fu'],
    [/zi$/g, 'ji'],
    [/di$/g, 'ji'],
    [/du$/g, 'zu'],
  ]

  for (const [pattern, replacement] of variants) {
    normalized = normalized.replace(pattern, replacement)
  }

  return normalized
}

/**
 * Levenshtein distance for fuzzy matching
 */
export function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
      }
    }
  }
  return dp[m][n]
}

/**
 * Unicode normalize and clean input
 */
export function normalizeInput(input: string): string {
  return input
    .normalize('NFC')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[　]/g, ' ')  // full-width space → regular space
}
