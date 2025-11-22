import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/streams/[username] - Get stream by username
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params

    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const stream = await prisma.stream.findFirst({
      where: { userId: user.id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
          }
        },
        game: {
          select: {
            id: true,
            name: true,
            slug: true,
            coverImageUrl: true,
          }
        }
      }
    })

    if (!stream) {
      return NextResponse.json(
        { error: 'Stream not found' },
        { status: 404 }
      )
    }

    // Don't expose stream key
    const { streamKey, ...safeStream } = stream

    return NextResponse.json(safeStream)
  } catch (error) {
    console.error('Get stream by username error:', error)
    return NextResponse.json(
      { error: 'Failed to get stream' },
      { status: 500 }
    )
  }
}
