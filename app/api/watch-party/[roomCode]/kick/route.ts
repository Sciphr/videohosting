import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
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
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

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

    // Only the host can kick participants
    if (watchParty.hostId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the host can remove participants' },
        { status: 403 }
      )
    }

    // Cannot kick the host
    if (userId === watchParty.hostId) {
      return NextResponse.json(
        { error: 'Cannot remove the host' },
        { status: 400 }
      )
    }

    // Remove the participant by marking them as left
    const participant = await prisma.watchPartyParticipant.updateMany({
      where: {
        partyId: watchParty.id,
        userId: userId,
        leftAt: null
      },
      data: {
        leftAt: new Date()
      }
    })

    if (participant.count === 0) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { message: 'Participant removed' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Kick participant error:', error)
    return NextResponse.json(
      { error: 'Failed to remove participant' },
      { status: 500 }
    )
  }
}
