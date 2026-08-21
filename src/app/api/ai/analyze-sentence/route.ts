import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const analyzeSchema = z.object({
  sentence: z.string().min(1).max(500),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'AI not configured. Add ANTHROPIC_API_KEY to .env.local' },
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

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const textBlock = response.content.find(b => b.type === 'text')
    const rawText = textBlock?.type === 'text' ? textBlock.text : '{}'

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
