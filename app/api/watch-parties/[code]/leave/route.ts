import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/watch-parties/[code]/leave - Leave watch party
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
      select: { id: true, hostId: true },
    });

    if (!party) {
      return NextResponse.json(
        { error: 'Watch party not found' },
        { status: 404 }
      );
    }

    // Host can't leave, only end the party
    if (party.hostId === session.user.id) {
      return NextResponse.json(
        { error: 'Host cannot leave. Use end party instead.' },
        { status: 400 }
      );
    }

    // Update participation
    await prisma.watchPartyParticipant.updateMany({
      where: {
        partyId: party.id,
        userId: session.user.id,
        leftAt: null,
      },
      data: { leftAt: new Date() },
    });

    return NextResponse.json({ message: 'Left watch party' });
  } catch (error) {
    console.error('Error leaving watch party:', error);
    return NextResponse.json(
      { error: 'Failed to leave watch party' },
      { status: 500 }
    );
  }
}
