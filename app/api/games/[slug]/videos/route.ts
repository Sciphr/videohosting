import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/games/[slug]/videos - Get videos for game
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const searchParams = request.nextUrl.searchParams;

    const type = searchParams.get('type') as 'CLIP' | 'FULL' | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Find game by slug
    const game = await prisma.game.findUnique({
      where: { slug },
    });

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    const where: any = {
      gameId: game.id,
      status: 'READY',
      deletedAt: null,
      isPublic: true,
    };

    if (type) {
      where.videoType = type;
    }

    const videos = await prisma.video.findMany({
      where,
      include: {
        uploader: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
            clips: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.video.count({ where });

    return NextResponse.json({
      game,
      videos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching game videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game videos' },
      { status: 500 }
    );
  }
}
