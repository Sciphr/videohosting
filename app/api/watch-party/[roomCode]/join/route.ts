import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { roomCode: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { roomCode } = params

    const watchParty = await prisma.watchParty.findUnique({
      where: { roomCode: roomCode.toUpperCase() }
    })

    if (!watchParty) {
      return NextResponse.json(
        { error: 'Watch party not found' },
        { status: 404 }
      )
    }

    if (watchParty.status === 'ENDED') {
      return NextResponse.json(
        { error: 'Watch party has ended' },
        { status: 410 }
      )
    }

    // Check if user is already a participant
    const existingParticipant = await prisma.watchPartyParticipant.findFirst({
      where: {
        partyId: watchParty.id,
        userId: session.user.id,
        leftAt: null
      }
    })

    if (existingParticipant) {
      return NextResponse.json(
        { message: 'Already joined', participant: existingParticipant }
      )
    }

    // Add user as participant
    const participant = await prisma.watchPartyParticipant.create({
      data: {
        partyId: watchParty.id,
        userId: session.user.id,
        joinedAt: new Date(),
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
    })

    return NextResponse.json(participant, { status: 201 })
  } catch (error) {
    console.error('Join watch party error:', error)
    return NextResponse.json(
      { error: 'Failed to join watch party' },
      { status: 500 }
    )
  }
}
