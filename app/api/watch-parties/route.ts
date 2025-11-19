import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { randomBytes } from 'crypto';

// GET /api/watch-parties - Get user's watch parties
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const parties = await prisma.watchParty.findMany({
      where: {
        OR: [
          { hostId: session.user.id },
          { participants: { some: { userId: session.user.id } } },
        ],
      },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
            duration: true,
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
        _count: {
          select: { participants: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ parties });
  } catch (error) {
    console.error('Error fetching watch parties:', error);
    return NextResponse.json(
      { error: 'Failed to fetch watch parties' },
      { status: 500 }
    );
  }
}

// POST /api/watch-parties - Create watch party
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { videoId, name, maxParticipants } = await request.json();

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    // Verify video exists
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: { id: true, title: true },
    });

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Generate unique room code
    const roomCode = randomBytes(4).toString('hex').toUpperCase();

    const party = await prisma.watchParty.create({
      data: {
        roomCode,
        name: name || `${video.title} Watch Party`,
        videoId,
        hostId: session.user.id,
        maxParticipants: maxParticipants || 10,
      },
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
      },
    });

    // Add host as participant
    await prisma.watchPartyParticipant.create({
      data: {
        partyId: party.id,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ party }, { status: 201 });
  } catch (error) {
    console.error('Error creating watch party:', error);
    return NextResponse.json(
      { error: 'Failed to create watch party' },
      { status: 500 }
    );
  }
}
