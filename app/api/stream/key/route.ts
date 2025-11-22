import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

// POST /api/stream/key - Regenerate stream key
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const stream = await prisma.stream.findFirst({
      where: { userId: session.user.id }
    })

    if (!stream) {
      return NextResponse.json(
        { error: 'Stream not found' },
        { status: 404 }
      )
    }

    // Can't regenerate key while live
    if (stream.status === 'LIVE') {
      return NextResponse.json(
        { error: 'Cannot regenerate key while streaming' },
        { status: 400 }
      )
    }

    const newKey = 'sk_' + randomBytes(16).toString('hex')

    const updated = await prisma.stream.update({
      where: { id: stream.id },
      data: { streamKey: newKey }
    })

    return NextResponse.json({ streamKey: updated.streamKey })
  } catch (error) {
    console.error('Regenerate stream key error:', error)
    return NextResponse.json(
      { error: 'Failed to regenerate stream key' },
      { status: 500 }
    )
  }
}
