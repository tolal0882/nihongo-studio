import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { GoogleGenAI, Type, type Content, type Part, type FunctionDeclaration } from '@google/genai'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash'
const MAX_TOOL_ITERATIONS = 5

const tutorSchema = z.object({
  message: z.string().min(1).max(2000),
  conversationId: z.string().optional(),
  context: z.enum(['tutor', 'analyzer', 'exercise']).default('tutor'),
})

// Tool definitions for Gemini function calling
const functionDeclarations: FunctionDeclaration[] = [
      {
        name: 'search_dictionary',
        description: 'Search the Nihongo Studio dictionary for a word',
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: { type: Type.STRING, description: 'The word to search (Japanese, romaji, or English)' },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_vocabulary',
        description: 'Get full vocabulary details by ID',
        parameters: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: 'Vocabulary ID' },
          },
          required: ['id'],
        },
      },
      {
        name: 'get_grammar',
        description: 'Get grammar pattern details by ID or pattern',
        parameters: {
          type: Type.OBJECT,
          properties: {
            pattern: { type: Type.STRING, description: 'Grammar pattern e.g. 〜たい' },
          },
          required: ['pattern'],
        },
      },
  {
    name: 'get_user_level',
    description: "Get the current user's Japanese level and progress",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
]

const tools = [{ functionDeclarations }]

// Tool implementations
async function executeTool(
  toolName: string,
  toolInput: Record<string, string>,
  userId: string
): Promise<string> {
  switch (toolName) {
    case 'search_dictionary': {
      const { search } = await import('@/lib/search/engine')
      const results = await search(toolInput.query, { limit: 5 })
      return JSON.stringify(results.slice(0, 3))
    }

    case 'get_vocabulary': {
      const vocab = await prisma.vocabulary.findUnique({
        where: { id: toolInput.id },
        include: { meanings: true, examples: { take: 2 } },
      })
      return JSON.stringify(vocab)
    }

    case 'get_grammar': {
      const grammar = await prisma.grammar.findFirst({
        where: { pattern: { contains: toolInput.pattern } },
        include: { examples: { take: 2 } },
      })
      return JSON.stringify(grammar)
    }

    case 'get_user_level': {
      const profile = await prisma.profile.findUnique({
        where: { userId },
        select: { currentLevel: true, targetLevel: true, xp: true, currentStreak: true },
      })
      return JSON.stringify(profile)
    }

    default:
      return JSON.stringify({ error: 'Unknown tool' })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'AI tutor not configured. Add GEMINI_API_KEY to your environment.' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const parsed = tutorSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { message, conversationId, context } = parsed.data
    const userId = session.user.id
    const userLevel = session.user.currentLevel ?? 'N5'

    // Get or create conversation
    let conversation = conversationId
      ? await prisma.aIConversation.findFirst({ where: { id: conversationId, userId } })
      : null

    if (!conversation) {
      conversation = await prisma.aIConversation.create({
        data: { userId, context, title: message.slice(0, 50) },
      })
    }

    // Get conversation history
    const history = await prisma.aIMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      take: 20,
    })

    // Save user message
    await prisma.aIMessage.create({
      data: { conversationId: conversation.id, role: 'user', content: message },
    })

    const systemPrompt = `You are Sensei, the AI Japanese tutor for Nihongo Studio — a Japanese learning platform.

The learner's current level is: **${userLevel}**

Your role:
- Explain Japanese vocabulary, grammar, and kanji in a clear, encouraging way
- Correct Japanese sentences with precise explanations adapted to the learner's level
- Use the provided tools to look up real dictionary data — never invent definitions, JLPT levels, or readings
- For corrections, show: ❌ incorrect → ✅ correct, with explanation
- For explanations, break down grammar patterns, particles, and sentence structure
- Always adapt your explanation depth to the learner's level (${userLevel})
- Be encouraging and educational, not just transactional

When responding, structure your answer as JSON with these fields:
{
  "answer": "your main explanation in markdown",
  "corrections": [{"original": "...", "corrected": "...", "explanation": "..."}],
  "vocabulary": [{"word": "...", "reading": "...", "meaning": "..."}],
  "grammar": [{"pattern": "...", "meaning": "...", "example": "..."}],
  "recommendations": ["what to study next..."]
}

Use tools when you need to look up specific words, grammar, or user data.`

    const contents: Content[] = [
      ...history.map((h): Content => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      })),
      { role: 'user', parts: [{ text: message }] },
    ]

    // Agentic loop with tool use
    let response = await client.models.generateContent({
      model: MODEL,
      contents,
      config: { systemInstruction: systemPrompt, tools },
    })

    let iterations = 0
    while ((response.functionCalls?.length ?? 0) > 0 && iterations < MAX_TOOL_ITERATIONS) {
      iterations++
      const functionCalls = response.functionCalls!

      const modelParts: Part[] = response.candidates?.[0]?.content?.parts ??
        functionCalls.map(fc => ({ functionCall: fc }))
      contents.push({ role: 'model', parts: modelParts })

      const responseParts: Part[] = []
      for (const fc of functionCalls) {
        if (!fc.name) continue
        const result = await executeTool(fc.name, (fc.args ?? {}) as Record<string, string>, userId)
        responseParts.push({
          functionResponse: { name: fc.name, response: { result } },
        })
      }
      contents.push({ role: 'user', parts: responseParts })

      response = await client.models.generateContent({
        model: MODEL,
        contents,
        config: { systemInstruction: systemPrompt, tools },
      })
    }

    const rawText = response.text ?? ''

    // Try to parse as structured JSON
    let structured: Record<string, unknown> = { answer: rawText }
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        structured = JSON.parse(jsonMatch[0])
      }
    } catch {
      structured = { answer: rawText }
    }

    // Save assistant message
    await prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: rawText,
        metadata: JSON.parse(JSON.stringify(structured)),
      },
    })

    return NextResponse.json({
      conversationId: conversation.id,
      response: structured,
    })
  } catch (error) {
    console.error('AI tutor error:', error)
    return NextResponse.json({ error: 'AI tutor unavailable' }, { status: 500 })
  }
}
