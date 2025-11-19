import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/videos/[id]/tags - Get tags for video
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const videoTags = await prisma.videoTag.findMany({
      where: { videoId: id },
      include: {
        tag: true,
      },
    });

    return NextResponse.json({
      tags: videoTags.map((vt) => vt.tag),
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}

// POST /api/videos/[id]/tags - Add tag to video
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
    const { tagId } = await request.json();

    // Verify ownership
    const video = await prisma.video.findUnique({
      where: { id },
      select: { uploaderId: true },
    });

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    if (video.uploaderId !== session.user.id) {
      return NextResponse.json(
        { error: 'Not authorized to tag this video' },
        { status: 403 }
      );
    }

    // Check if tag exists
    const tag = await prisma.tag.findUnique({
      where: { id: tagId },
    });

    if (!tag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      );
    }

    // Add tag to video
    const videoTag = await prisma.videoTag.create({
      data: {
        videoId: id,
        tagId,
      },
      include: {
        tag: true,
      },
    });

    return NextResponse.json({ tag: videoTag.tag }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Tag already added to video' },
        { status: 400 }
      );
    }
    console.error('Error adding tag:', error);
    return NextResponse.json(
      { error: 'Failed to add tag' },
      { status: 500 }
    );
  }
}

// DELETE /api/videos/[id]/tags - Remove tag from video
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
    const { tagId } = await request.json();

    // Verify ownership
    const video = await prisma.video.findUnique({
      where: { id },
      select: { uploaderId: true },
    });

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    if (video.uploaderId !== session.user.id) {
      return NextResponse.json(
        { error: 'Not authorized to modify tags on this video' },
        { status: 403 }
      );
    }

    // Remove tag
    await prisma.videoTag.delete({
      where: {
        videoId_tagId: {
          videoId: id,
          tagId,
        },
      },
    });

    return NextResponse.json({ message: 'Tag removed' });
  } catch (error) {
    console.error('Error removing tag:', error);
    return NextResponse.json(
      { error: 'Failed to remove tag' },
      { status: 500 }
    );
  }
}
