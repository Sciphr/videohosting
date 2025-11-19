import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createHash } from 'crypto';

// POST /api/videos/[id]/view - Record a view
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const body = await request.json().catch(() => ({}));

    // Get IP hash for anonymous deduplication
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const ipHash = createHash('sha256').update(ip).digest('hex');

    // Check for recent view from same user/IP (prevent spam)
    const recentView = await prisma.videoView.findFirst({
      where: {
        videoId: id,
        OR: [
          { userId: session?.user?.id },
          { ipHash: session?.user?.id ? undefined : ipHash },
        ],
        createdAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes
        },
      },
    });

    if (recentView) {
      // Update watch duration if provided
      if (body.watchDuration) {
        await prisma.videoView.update({
          where: { id: recentView.id },
          data: { watchDuration: body.watchDuration },
        });
      }
      return NextResponse.json({ message: 'View already recorded' });
    }

    // Record new view
    await prisma.videoView.create({
      data: {
        videoId: id,
        userId: session?.user?.id || null,
        ipHash: session?.user?.id ? null : ipHash,
        watchDuration: body.watchDuration || null,
      },
    });

    // Increment view count
    await prisma.video.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json({ message: 'View recorded' });
  } catch (error) {
    console.error('Error recording view:', error);
    return NextResponse.json(
      { error: 'Failed to record view' },
      { status: 500 }
    );
  }
}
