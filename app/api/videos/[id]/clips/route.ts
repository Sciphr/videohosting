import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/videos/[id]/clips - Get clips from this video
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const clips = await prisma.video.findMany({
      where: {
        parentVideoId: id,
        status: 'READY',
        deletedAt: null,
      },
      include: {
        uploader: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        clippedBy: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.video.count({
      where: {
        parentVideoId: id,
        status: 'READY',
        deletedAt: null,
      },
    });

    return NextResponse.json({
      clips,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching clips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clips' },
      { status: 500 }
    );
  }
}

// POST /api/videos/[id]/clips - Create clip from video
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { title, description, startTime, endTime } = await request.json();

    // Validate required fields
    if (!title || startTime === undefined || endTime === undefined) {
      return NextResponse.json(
        { error: 'Title, startTime, and endTime are required' },
        { status: 400 }
      );
    }

    if (startTime >= endTime) {
      return NextResponse.json(
        { error: 'Start time must be before end time' },
        { status: 400 }
      );
    }

    // Get parent video
    const parentVideo = await prisma.video.findUnique({
      where: { id },
      select: {
        id: true,
        uploaderId: true,
        duration: true,
        fileUrl: true,
        fileKey: true,
        gameId: true,
      },
    });

    if (!parentVideo) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Validate time range
    if (parentVideo.duration && endTime > parentVideo.duration) {
      return NextResponse.json(
        { error: 'End time exceeds video duration' },
        { status: 400 }
      );
    }

    // For MVP: Create a placeholder clip entry
    // In production, this would trigger FFmpeg processing
    const clip = await prisma.video.create({
      data: {
        title,
        description: description || null,
        videoType: 'CLIP',
        status: 'PROCESSING', // Would be set to READY after FFmpeg processing
        fileUrl: parentVideo.fileUrl, // Placeholder - would be new file after processing
        fileKey: `clips/${Date.now()}-placeholder`, // Placeholder
        duration: Math.floor(endTime - startTime),
        parentVideoId: id,
        clipStartTime: startTime,
        clipEndTime: endTime,
        uploaderId: parentVideo.uploaderId,
        clippedById: session.user.id,
        gameId: parentVideo.gameId,
      },
      include: {
        uploader: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Update clip count on parent
    await prisma.video.update({
      where: { id },
      data: { clipCount: { increment: 1 } },
    });

    // Notify video owner if someone else clipped their video
    if (parentVideo.uploaderId !== session.user.id) {
      await prisma.notification.create({
        data: {
          userId: parentVideo.uploaderId,
          type: 'NEW_CLIP',
          title: 'New clip created',
          message: `${session.user.name || 'Someone'} created a clip from your video`,
          referenceId: clip.id,
        },
      });
    }

    return NextResponse.json({
      clip,
      message: 'Clip created. Processing will begin shortly.',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating clip:', error);
    return NextResponse.json(
      { error: 'Failed to create clip' },
      { status: 500 }
    );
  }
}
