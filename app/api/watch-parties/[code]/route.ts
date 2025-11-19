import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/watch-parties/[code] - Get watch party by code
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const party = await prisma.watchParty.findUnique({
      where: { roomCode: code },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
            duration: true,
            fileUrl: true,
          },
        },
        host: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
          where: { leftAt: null },
        },
      },
    });

    if (!party) {
      return NextResponse.json(
        { error: 'Watch party not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ party });
  } catch (error) {
    console.error('Error fetching watch party:', error);
    return NextResponse.json(
      { error: 'Failed to fetch watch party' },
      { status: 500 }
    );
  }
}

// PATCH /api/watch-parties/[code] - Update watch party state (host only)
export async function PATCH(
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
    const { currentTime, isPlaying, isActive } = await request.json();

    // Check if user is host
    const party = await prisma.watchParty.findUnique({
      where: { roomCode: code },
      select: { hostId: true },
    });

    if (!party) {
      return NextResponse.json(
        { error: 'Watch party not found' },
        { status: 404 }
      );
    }

    if (party.hostId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the host can update the party' },
        { status: 403 }
      );
    }

    const updatedParty = await prisma.watchParty.update({
      where: { roomCode: code },
      data: {
        ...(currentTime !== undefined && { currentTime }),
        ...(isPlaying !== undefined && { isPlaying }),
        ...(isActive !== undefined && { isActive }),
        ...(isActive === false && { endedAt: new Date() }),
      },
    });

    return NextResponse.json({ party: updatedParty });
  } catch (error) {
    console.error('Error updating watch party:', error);
    return NextResponse.json(
      { error: 'Failed to update watch party' },
      { status: 500 }
    );
  }
}

// DELETE /api/watch-parties/[code] - End watch party
export async function DELETE(
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

    // Check if user is host
    const party = await prisma.watchParty.findUnique({
      where: { roomCode: code },
      select: { hostId: true },
    });

    if (!party) {
      return NextResponse.json(
        { error: 'Watch party not found' },
        { status: 404 }
      );
    }

    if (party.hostId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the host can end the party' },
        { status: 403 }
      );
    }

    await prisma.watchParty.update({
      where: { roomCode: code },
      data: {
        isActive: false,
        endedAt: new Date(),
      },
    });

    return NextResponse.json({ message: 'Watch party ended' });
  } catch (error) {
    console.error('Error ending watch party:', error);
    return NextResponse.json(
      { error: 'Failed to end watch party' },
      { status: 500 }
    );
  }
}
