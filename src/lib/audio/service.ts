/**
 * Audio service — resolves audio for vocabulary and arbitrary Japanese text
 * Priority: stored URL → TTS fallback
 */

export interface AudioConfig {
  storageUrl?: string
  ttsProvider?: 'webspeech' | 'google' | 'elevenlabs'
}

export function getVocabularyAudioUrl(vocabularyId: string, audioUrl?: string | null): string | null {
  if (audioUrl) return audioUrl

  const storageUrl = process.env.AUDIO_STORAGE_URL
  if (storageUrl) {
    return `${storageUrl}/vocabulary/${vocabularyId}.mp3`
  }

  return null
}

/**
 * Server-side: resolve best audio URL for a vocabulary item
 */
export async function resolveVocabularyAudio(
  vocabularyId: string,
  primaryReading: string
): Promise<{ type: 'stored' | 'tts'; url: string | null; text: string }> {
  const stored = getVocabularyAudioUrl(vocabularyId)

  if (stored) {
    return { type: 'stored', url: stored, text: primaryReading }
  }

  // TTS fallback — return the text for client-side Web Speech API
  return { type: 'tts', url: null, text: primaryReading }
}
