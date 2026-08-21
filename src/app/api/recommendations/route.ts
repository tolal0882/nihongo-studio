import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { generateRecommendations } from '@/lib/recommendation/engine'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userLevel = (session.user.currentLevel as any) ?? 'N5'

    const recommendations = await generateRecommendations({
      userId: session.user.id,
      userLevel,
      limit: 5,
    })

    return NextResponse.json({ recommendations })
  } catch (error) {
    console.error('Recommendations error:', error)
    return NextResponse.json({ error: 'Failed to get recommendations' }, { status: 500 })
  }
}
