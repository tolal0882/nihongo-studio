import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { GoogleGenAI } from '@google/genai'
import { z } from 'zod'

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash'

const analyzeSchema = z.object({
  sentence: z.string().min(1).max(500),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'AI not configured. Add GEMINI_API_KEY to your environment.' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const parsed = analyzeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { sentence } = parsed.data
    const userLevel = session.user.currentLevel ?? 'N5'

    const prompt = `Analyze this Japanese sentence for a ${userLevel} level learner.

Sentence: ${sentence}

Return ONLY valid JSON in this exact format:
{
  "japanese": "${sentence}",
  "romaji": "romanized version",
  "english": "English translation",
  "naturalness": 5,
  "naturalnessNote": "explanation of naturalness rating (1-5)",
  "corrections": [
    {"original": "incorrect part", "corrected": "correct form", "explanation": "why"}
  ],
  "vocabulary": [
    {"word": "word", "reading": "hiragana", "meaning": "meaning", "jlpt": "N5"}
  ],
  "grammar": [
    {"pattern": "pattern", "meaning": "meaning", "partInSentence": "part of sentence"}
  ],
  "particles": [
    {"particle": "は", "function": "topic marker", "example": "phrase using it"}
  ],
  "jlptEstimate": "N5",
  "tips": ["tip for improvement at their level"]
}`

    const response = await client.models.generateContent({
      model: MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    })

    const rawText = response.text ?? '{}'

    let analysis: Record<string, unknown> = {}
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      }
    } catch {
      analysis = { japanese: sentence, english: 'Analysis failed', naturalness: 3 }
    }

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('Sentence analysis error:', error)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
