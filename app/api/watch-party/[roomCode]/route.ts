import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  try {
    const { roomCode } = await params
    const session = await getServerSession()

    console.log('Watch party GET - session:', session?.user?.id ? 'authenticated' : 'not authenticated')

    if (!session?.user?.id) {
      console.log('Watch party GET - 401 Unauthorized')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const watchParty = await prisma.watchParty.findUnique({
      where: { roomCode: roomCode.toUpperCase() },
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
        },
        participants: {
          where: {
            leftAt: null
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              }
            }
          }
        }
      }
    })

    if (!watchParty) {
      return NextResponse.json(
        { error: 'Watch party not found' },
        { status: 404 }
      )
    }

    if (!watchParty.isActive || watchParty.endedAt) {
      return NextResponse.json(
        { error: 'Watch party has ended' },
        { status: 410 }
      )
    }

    return NextResponse.json(watchParty)
  } catch (error) {
    console.error('Get watch party error:', error)
    return NextResponse.json(
      { error: 'Failed to get watch party' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  try {
    const { roomCode } = await params
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { isActive, currentTime, isPlaying } = body

    // Get the watch party
    const watchParty = await prisma.watchParty.findUnique({
      where: { roomCode: roomCode.toUpperCase() }
    })

    if (!watchParty) {
      return NextResponse.json(
        { error: 'Watch party not found' },
        { status: 404 }
      )
    }

    // Only the host can close the watch party
    if (isActive === false && watchParty.hostId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the host can close the watch party' },
        { status: 403 }
      )
    }

    // Update the watch party
    const updated = await prisma.watchParty.update({
      where: { roomCode: roomCode.toUpperCase() },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(currentTime !== undefined && { currentTime }),
        ...(isPlaying !== undefined && { isPlaying }),
        ...(isActive === false && { endedAt: new Date() }),
      },
      include: {
        participants: {
          where: { leftAt: null },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              }
            }
          }
        }
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update watch party error:', error)
    return NextResponse.json(
      { error: 'Failed to update watch party' },
      { status: 500 }
    )
  }
}
