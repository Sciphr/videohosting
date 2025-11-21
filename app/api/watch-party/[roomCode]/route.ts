import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { roomCode: string } }
) {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { roomCode } = params

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
