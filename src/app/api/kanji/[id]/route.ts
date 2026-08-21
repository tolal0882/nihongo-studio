import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const kanji = await prisma.kanji.findUnique({
      where: { id },
      include: {
        readings: true,
        examples: { orderBy: { order: 'asc' } },
        strokes: { orderBy: { order: 'asc' } },
      },
    })

    if (!kanji) {
      return NextResponse.json({ error: 'Kanji not found' }, { status: 404 })
    }

    return NextResponse.json({ kanji })
  } catch (error) {
    console.error('Kanji fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch kanji' }, { status: 500 })
  }
}
