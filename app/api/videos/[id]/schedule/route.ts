import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/videos/[id]/schedule - Update scheduled publish time
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { scheduledPublishAt } = body

    // Find the video
    const video = await prisma.video.findUnique({
      where: { id },
      select: {
        id: true,
        uploaderId: true,
        status: true,
      }
    })

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    // Check ownership
    if (video.uploaderId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Only allow scheduling drafts or already scheduled videos
    if (video.status !== 'DRAFT' && video.status !== 'SCHEDULED') {
      return NextResponse.json(
        { error: 'Can only schedule unpublished videos' },
        { status: 400 }
      )
    }

    // Validate scheduled time
    if (!scheduledPublishAt) {
      return NextResponse.json(
        { error: 'Scheduled time is required' },
        { status: 400 }
      )
    }

    const scheduledDateTime = new Date(scheduledPublishAt)
    if (scheduledDateTime <= new Date()) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 400 }
      )
    }

    // Update video
    const updatedVideo = await prisma.video.update({
      where: { id },
      data: {
        status: 'SCHEDULED',
        scheduledPublishAt: scheduledDateTime,
      },
      include: {
        uploader: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          }
        },
        game: true,
      }
    })

    return NextResponse.json({
      success: true,
      video: updatedVideo
    })
  } catch (error) {
    console.error('Schedule video error:', error)
    return NextResponse.json(
      { error: 'Failed to schedule video' },
      { status: 500 }
    )
  }
}

// DELETE /api/videos/[id]/schedule - Cancel scheduling (convert to draft)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Find the video
    const video = await prisma.video.findUnique({
      where: { id },
      select: {
        id: true,
        uploaderId: true,
        status: true,
      }
    })

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    // Check ownership
    if (video.uploaderId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Only allow canceling scheduled videos
    if (video.status !== 'SCHEDULED') {
      return NextResponse.json(
        { error: 'Video is not scheduled' },
        { status: 400 }
      )
    }

    // Convert to draft
    const updatedVideo = await prisma.video.update({
      where: { id },
      data: {
        status: 'DRAFT',
        scheduledPublishAt: null,
      },
      include: {
        uploader: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          }
        },
        game: true,
      }
    })

    return NextResponse.json({
      success: true,
      video: updatedVideo
    })
  } catch (error) {
    console.error('Cancel schedule error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel schedule' },
      { status: 500 }
    )
  }
}
