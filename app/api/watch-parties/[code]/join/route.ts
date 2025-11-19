import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/watch-parties/[code]/join - Join watch party
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { code } = await params;

    // Get party
    const party = await prisma.watchParty.findUnique({
      where: { roomCode: code },
      include: {
        _count: {
          select: { participants: { where: { leftAt: null } } },
        },
      },
    });

    if (!party) {
      return NextResponse.json(
        { error: 'Watch party not found' },
        { status: 404 }
      );
    }

    if (!party.isActive) {
      return NextResponse.json(
        { error: 'Watch party has ended' },
        { status: 400 }
      );
    }

    // Check capacity
    if (party._count.participants >= party.maxParticipants) {
      return NextResponse.json(
        { error: 'Watch party is full' },
        { status: 400 }
      );
    }

    // Check if already participating
    const existing = await prisma.watchPartyParticipant.findUnique({
      where: {
        partyId_userId: {
          partyId: party.id,
          userId: session.user.id,
        },
      },
    });

    if (existing && !existing.leftAt) {
      return NextResponse.json(
        { error: 'Already in this watch party' },
        { status: 400 }
      );
    }

    // Rejoin or create new participation
    if (existing) {
      await prisma.watchPartyParticipant.update({
        where: { id: existing.id },
        data: { leftAt: null, joinedAt: new Date() },
      });
    } else {
      await prisma.watchPartyParticipant.create({
        data: {
          partyId: party.id,
          userId: session.user.id,
        },
      });
    }

    return NextResponse.json({ message: 'Joined watch party' }, { status: 201 });
  } catch (error) {
    console.error('Error joining watch party:', error);
    return NextResponse.json(
      { error: 'Failed to join watch party' },
      { status: 500 }
    );
  }
}
