import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

// Generate a unique stream key
function generateStreamKey(): string {
  return 'sk_' + randomBytes(16).toString('hex')
}

// GET /api/stream - Get current user's stream settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Find or create stream for user
    let stream = await prisma.stream.findFirst({
      where: { userId: session.user.id },
      include: {
        game: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
      }
    })

    if (!stream) {
      // Create a new stream entry for this user
      stream = await prisma.stream.create({
        data: {
          title: `${session.user.username}'s Stream`,
          streamKey: generateStreamKey(),
          userId: session.user.id,
        },
        include: {
          game: {
            select: {
              id: true,
              name: true,
              slug: true,
            }
          }
        }
      })
    }

    return NextResponse.json(stream)
  } catch (error) {
    console.error('Get stream error:', error)
    return NextResponse.json(
      { error: 'Failed to get stream' },
      { status: 500 }
    )
  }
}

// PATCH /api/stream - Update stream settings
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, description, gameId, thumbnailUrl } = body

    const stream = await prisma.stream.findFirst({
      where: { userId: session.user.id }
    })

    if (!stream) {
      return NextResponse.json(
        { error: 'Stream not found' },
        { status: 404 }
      )
    }

    const updated = await prisma.stream.update({
      where: { id: stream.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(gameId !== undefined && { gameId: gameId || null }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl }),
      },
      include: {
        game: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update stream error:', error)
    return NextResponse.json(
      { error: 'Failed to update stream' },
      { status: 500 }
    )
  }
}
