import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/videos/[id]/publish - Publish a draft or scheduled video
export async function POST(
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

    // Only allow publishing drafts or scheduled videos
    if (video.status !== 'DRAFT' && video.status !== 'SCHEDULED') {
      return NextResponse.json(
        { error: 'Video is already published or cannot be published' },
        { status: 400 }
      )
    }

    // Update to published state
    const updatedVideo = await prisma.video.update({
      where: { id },
      data: {
        status: 'READY',
        publishedAt: new Date(),
        scheduledPublishAt: null, // Clear scheduled time
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
    console.error('Publish video error:', error)
    return NextResponse.json(
      { error: 'Failed to publish video' },
      { status: 500 }
    )
  }
}
