import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/videos/[id]/chapters - List chapters for a video
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoId } = await params

    const chapters = await prisma.chapter.findMany({
      where: { videoId },
      orderBy: { timestamp: 'asc' },
    })

    return NextResponse.json(chapters)
  } catch (error) {
    console.error('Get chapters error:', error)
    return NextResponse.json(
      { error: 'Failed to get chapters' },
      { status: 500 }
    )
  }
}

// POST /api/videos/[id]/chapters - Create a chapter (owner only)
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

    const { id: videoId } = await params
    const body = await request.json()
    const { title, timestamp, thumbnailUrl } = body

    if (!title || timestamp === undefined) {
      return NextResponse.json(
        { error: 'Title and timestamp are required' },
        { status: 400 }
      )
    }

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
        { error: 'Only the video owner can add chapters' },
        { status: 403 }
      )
    }

    // Validate timestamp is within video duration
    if (video.duration && timestamp > video.duration) {
      return NextResponse.json(
        { error: 'Timestamp exceeds video duration' },
        { status: 400 }
      )
    }

    if (timestamp < 0) {
      return NextResponse.json(
        { error: 'Timestamp cannot be negative' },
        { status: 400 }
      )
    }

    // Get the highest position for ordering
    const lastChapter = await prisma.chapter.findFirst({
      where: { videoId },
      orderBy: { position: 'desc' },
      select: { position: true }
    })

    const position = (lastChapter?.position ?? -1) + 1

    const chapter = await prisma.chapter.create({
      data: {
        videoId,
        title,
        timestamp: parseFloat(timestamp),
        thumbnailUrl,
        position,
      }
    })

    return NextResponse.json(chapter, { status: 201 })
  } catch (error) {
    console.error('Create chapter error:', error)
    return NextResponse.json(
      { error: 'Failed to create chapter' },
      { status: 500 }
    )
  }
}

// PUT /api/videos/[id]/chapters - Bulk update chapters (reorder, etc.)
export async function PUT(
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

    const { id: videoId } = await params
    const body = await request.json()
    const { chapters } = body

    if (!Array.isArray(chapters)) {
      return NextResponse.json(
        { error: 'Chapters array is required' },
        { status: 400 }
      )
    }

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
        { error: 'Only the video owner can update chapters' },
        { status: 403 }
      )
    }

    // Update all chapters in a transaction
    const updatedChapters = await prisma.$transaction(
      chapters.map((chapter: { id: string; title?: string; timestamp?: number; position?: number }) =>
        prisma.chapter.update({
          where: { id: chapter.id },
          data: {
            ...(chapter.title !== undefined && { title: chapter.title }),
            ...(chapter.timestamp !== undefined && { timestamp: chapter.timestamp }),
            ...(chapter.position !== undefined && { position: chapter.position }),
          }
        })
      )
    )

    return NextResponse.json(updatedChapters)
  } catch (error) {
    console.error('Update chapters error:', error)
    return NextResponse.json(
      { error: 'Failed to update chapters' },
      { status: 500 }
    )
  }
}
