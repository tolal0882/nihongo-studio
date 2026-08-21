import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const grammar = await prisma.grammar.findUnique({
      where: { id },
      include: {
        examples: true,
        relatedGrammar: { include: { grammarB: true } },
        prerequisites: { include: { prerequisite: true } },
      },
    })

    if (!grammar) {
      return NextResponse.json({ error: 'Grammar not found' }, { status: 404 })
    }

    return NextResponse.json({ grammar })
  } catch (error) {
    console.error('Grammar fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch grammar' }, { status: 500 })
  }
}
