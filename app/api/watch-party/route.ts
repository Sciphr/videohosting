import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

// Generate a unique room code
function generateRoomCode(): string {
  return randomBytes(4).toString('hex').toUpperCase()
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { videoId, requireAuth = false } = body

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      )
    }

    // Verify video exists
    const video = await prisma.video.findUnique({
      where: { id: videoId }
    })

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    // Generate unique room code
    let roomCode = generateRoomCode()
    let existing = await prisma.watchParty.findUnique({
      where: { roomCode }
    })

    // Regenerate if collision (unlikely but possible)
    while (existing) {
      roomCode = generateRoomCode()
      existing = await prisma.watchParty.findUnique({
        where: { roomCode }
      })
    }

    // Create watch party
    const watchParty = await prisma.watchParty.create({
      data: {
        roomCode,
        videoId,
        hostId: session.user.id,
        isActive: true,
        requireAuth: Boolean(requireAuth),
      },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            fileUrl: true,
            thumbnailUrl: true,
            duration: true,
          }
        },
        host: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          }
        }
      }
    })

    // Create host as first participant
    await prisma.watchPartyParticipant.create({
      data: {
        partyId: watchParty.id,
        userId: session.user.id,
        joinedAt: new Date(),
      }
    })

    return NextResponse.json(watchParty, { status: 201 })
  } catch (error) {
    console.error('Create watch party error:', error)
    return NextResponse.json(
      { error: 'Failed to create watch party' },
      { status: 500 }
    )
  }
}
