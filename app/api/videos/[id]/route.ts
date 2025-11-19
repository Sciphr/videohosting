import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { unlink } from 'fs/promises';
import { join } from 'path';

// GET /api/videos/[id] - Get single video
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        uploader: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
          },
        },
        game: true,
        parentVideo: {
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
          },
        },
        clips: {
          where: { status: 'READY', deletedAt: null },
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
            duration: true,
            viewCount: true,
          },
          take: 10,
        },
        tags: {
          include: {
            tag: true,
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
    });

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    if (video.deletedAt || video.status !== 'READY') {
      return NextResponse.json(
        { error: 'Video not available' },
        { status: 404 }
      );
    }

    return NextResponse.json({ video });
  } catch (error) {
    console.error('Error fetching video:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video' },
      { status: 500 }
    );
  }
}

// PATCH /api/videos/[id] - Update video
export async function PATCH(
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
    const body = await request.json();

    // Check ownership
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
        { error: 'Not authorized to update this video' },
        { status: 403 }
      );
    }

    // Update allowed fields
    const { title, description, isPublic, gameId } = body;

    const updatedVideo = await prisma.video.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(isPublic !== undefined && { isPublic }),
        ...(gameId !== undefined && { gameId }),
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
        game: true,
      },
    });

    return NextResponse.json({ video: updatedVideo });
  } catch (error) {
    console.error('Error updating video:', error);
    return NextResponse.json(
      { error: 'Failed to update video' },
      { status: 500 }
    );
  }
}

// DELETE /api/videos/[id] - Delete video (soft delete)
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

    // Check ownership
    const video = await prisma.video.findUnique({
      where: { id },
      select: { uploaderId: true, fileUrl: true, fileKey: true },
    });

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    if (video.uploaderId !== session.user.id) {
      return NextResponse.json(
        { error: 'Not authorized to delete this video' },
        { status: 403 }
      );
    }

    // Soft delete
    await prisma.video.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'DELETED',
      },
    });

    // Optionally delete file from storage
    // For local storage:
    // try {
    //   const filePath = join(process.cwd(), 'public', video.fileUrl);
    //   await unlink(filePath);
    // } catch (e) {
    //   console.error('Failed to delete file:', e);
    // }

    return NextResponse.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Error deleting video:', error);
    return NextResponse.json(
      { error: 'Failed to delete video' },
      { status: 500 }
    );
  }
}
