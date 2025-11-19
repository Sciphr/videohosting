import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/users/[id]/videos - Get user's videos
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const searchParams = request.nextUrl.searchParams;

    const type = searchParams.get('type') as 'CLIP' | 'FULL' | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Check if viewing own profile or public videos
    const isOwnProfile = session?.user?.id === id;

    const where: any = {
      uploaderId: id,
      status: 'READY',
      deletedAt: null,
    };

    // Only show public videos if not own profile
    if (!isOwnProfile) {
      where.isPublic = true;
    }

    if (type) {
      where.videoType = type;
    }

    const videos = await prisma.video.findMany({
      where,
      include: {
        game: {
          select: {
            id: true,
            name: true,
            slug: true,
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
      videos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching user videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user videos' },
      { status: 500 }
    );
  }
}
