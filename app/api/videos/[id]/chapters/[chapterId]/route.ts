import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/videos/[id]/chapters/[chapterId] - Update a chapter
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: videoId, chapterId } = await params
    const body = await request.json()
    const { title, timestamp, thumbnailUrl } = body

    // Check if video exists and user is the owner
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: { uploaderId: true, duration: true }
    })

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    if (video.uploaderId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the video owner can update chapters' },
        { status: 403 }
      )
    }

    // Check chapter exists and belongs to this video
    const existingChapter = await prisma.chapter.findFirst({
      where: { id: chapterId, videoId }
    })

    if (!existingChapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      )
    }

    // Validate timestamp if provided
    if (timestamp !== undefined) {
      if (timestamp < 0) {
        return NextResponse.json(
          { error: 'Timestamp cannot be negative' },
          { status: 400 }
        )
      }
      if (video.duration && timestamp > video.duration) {
        return NextResponse.json(
          { error: 'Timestamp exceeds video duration' },
          { status: 400 }
        )
      }
    }

    const chapter = await prisma.chapter.update({
      where: { id: chapterId },
      data: {
        ...(title !== undefined && { title }),
        ...(timestamp !== undefined && { timestamp: parseFloat(timestamp) }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl }),
      }
    })

    return NextResponse.json(chapter)
  } catch (error) {
    console.error('Update chapter error:', error)
    return NextResponse.json(
      { error: 'Failed to update chapter' },
      { status: 500 }
    )
  }
}

// DELETE /api/videos/[id]/chapters/[chapterId] - Delete a chapter
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: videoId, chapterId } = await params

    // Check if video exists and user is the owner
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: { uploaderId: true }
    })

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    if (video.uploaderId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the video owner can delete chapters' },
        { status: 403 }
      )
    }

    // Check chapter exists and belongs to this video
    const existingChapter = await prisma.chapter.findFirst({
      where: { id: chapterId, videoId }
    })

    if (!existingChapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      )
    }

    await prisma.chapter.delete({
      where: { id: chapterId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete chapter error:', error)
    return NextResponse.json(
      { error: 'Failed to delete chapter' },
      { status: 500 }
    )
  }
}
