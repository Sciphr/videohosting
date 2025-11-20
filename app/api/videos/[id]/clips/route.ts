import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const videoId = params.id
    const body = await request.json()
    const { title, description, startTime, endTime } = body

    // Validate input
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    if (typeof startTime !== 'number' || typeof endTime !== 'number') {
      return NextResponse.json(
        { error: 'Invalid time values' },
        { status: 400 }
      )
    }

    if (endTime <= startTime) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      )
    }

    const clipDuration = endTime - startTime
    if (clipDuration < 5) {
      return NextResponse.json(
        { error: 'Clip must be at least 5 seconds long' },
        { status: 400 }
      )
    }

    if (clipDuration > 120) {
      return NextResponse.json(
        { error: 'Clip cannot be longer than 2 minutes' },
        { status: 400 }
      )
    }

    // Get parent video
    const parentVideo = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        game: true,
      }
    })

    if (!parentVideo) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    if (parentVideo.deletedAt) {
      return NextResponse.json(
        { error: 'Video has been deleted' },
        { status: 404 }
      )
    }

    // Validate times are within video duration
    if (startTime < 0 || endTime > parentVideo.duration) {
      return NextResponse.json(
        { error: 'Invalid time range for this video' },
        { status: 400 }
      )
    }

    // Create the clip
    // Note: For now, we're creating the database entry with the same fileUrl as parent
    // In a full implementation, this would trigger an FFmpeg job to extract the clip
    const clip = await prisma.video.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        uploadedById: session.user.id,
        videoType: 'CLIP',
        parentVideoId: videoId,
        clipStartTime: startTime,
        clipEndTime: endTime,
        duration: clipDuration,
        fileUrl: parentVideo.fileUrl, // Temporary - will be replaced after FFmpeg processing
        thumbnailUrl: parentVideo.thumbnailUrl,
        gameId: parentVideo.gameId,
        status: 'PROCESSING', // Will be updated to READY after FFmpeg processes
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
        parentVideo: {
          select: {
            id: true,
            title: true,
            uploader: {
              select: {
                id: true,
                username: true,
                displayName: true,
              }
            }
          }
        }
      }
    })

    // Create notification for parent video owner (if different from clipper)
    if (parentVideo.uploadedById !== session.user.id) {
      await prisma.notification.create({
        data: {
          userId: parentVideo.uploadedById,
          type: 'CLIP_CREATED',
          message: `${session.user.username} created a clip from your video "${parentVideo.title}"`,
          videoId: clip.id,
        }
      })
    }

    // TODO: Trigger FFmpeg job to extract the clip
    // For now, we'll just return the clip with PROCESSING status
    // In production, you'd use a job queue (Bull, BullMQ, etc.) to process this asynchronously

    return NextResponse.json(clip, { status: 201 })
  } catch (error) {
    console.error('Create clip error:', error)
    return NextResponse.json(
      { error: 'Failed to create clip' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const videoId = params.id

    const clips = await prisma.video.findMany({
      where: {
        parentVideoId: videoId,
        deletedAt: null,
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
        game: {
          select: {
            id: true,
            name: true,
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(clips)
  } catch (error) {
    console.error('Get clips error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clips' },
      { status: 500 }
    )
  }
}
