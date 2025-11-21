import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Fetch all active watch parties with details
    const activeParties = await prisma.watchParty.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
          }
        },
        host: {
          select: {
            id: true,
            username: true,
            displayName: true,
          }
        },
        participants: {
          where: {
            leftAt: null
          },
          select: {
            id: true,
            userId: true,
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      }
    })

    // Transform data to include participant count
    const partiesWithCount = activeParties.map(party => ({
      id: party.id,
      roomCode: party.roomCode,
      video: party.video,
      host: party.host,
      participantCount: party.participants.length,
      startedAt: party.startedAt,
    }))

    return NextResponse.json({ parties: partiesWithCount })
  } catch (error) {
    console.error('Get active watch parties error:', error)
    return NextResponse.json(
      { error: 'Failed to get active watch parties' },
      { status: 500 }
    )
  }
}
