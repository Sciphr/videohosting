import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/videos/[id]/like - Like video
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

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        videoId_userId: {
          videoId: id,
          userId: session.user.id,
        },
      },
    });

    if (existingLike) {
      return NextResponse.json(
        { error: 'Already liked' },
        { status: 400 }
      );
    }

    // Create like
    await prisma.like.create({
      data: {
        videoId: id,
        userId: session.user.id,
      },
    });

    // Update like count
    await prisma.video.update({
      where: { id },
      data: { likeCount: { increment: 1 } },
    });

    return NextResponse.json({ message: 'Video liked' }, { status: 201 });
  } catch (error) {
    console.error('Error liking video:', error);
    return NextResponse.json(
      { error: 'Failed to like video' },
      { status: 500 }
    );
  }
}

// DELETE /api/videos/[id]/like - Unlike video
export async function DELETE(
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

    // Check if liked
    const existingLike = await prisma.like.findUnique({
      where: {
        videoId_userId: {
          videoId: id,
          userId: session.user.id,
        },
      },
    });

    if (!existingLike) {
      return NextResponse.json(
        { error: 'Not liked' },
        { status: 400 }
      );
    }

    // Delete like
    await prisma.like.delete({
      where: {
        videoId_userId: {
          videoId: id,
          userId: session.user.id,
        },
      },
    });

    // Update like count
    await prisma.video.update({
      where: { id },
      data: { likeCount: { decrement: 1 } },
    });

    return NextResponse.json({ message: 'Video unliked' });
  } catch (error) {
    console.error('Error unliking video:', error);
    return NextResponse.json(
      { error: 'Failed to unlike video' },
      { status: 500 }
    );
  }
}

// GET /api/videos/[id]/like - Check if user liked video
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ liked: false });
    }

    const { id } = await params;

    const like = await prisma.like.findUnique({
      where: {
        videoId_userId: {
          videoId: id,
          userId: session.user.id,
        },
      },
    });

    return NextResponse.json({ liked: !!like });
  } catch (error) {
    console.error('Error checking like status:', error);
    return NextResponse.json(
      { error: 'Failed to check like status' },
      { status: 500 }
    );
  }
}
