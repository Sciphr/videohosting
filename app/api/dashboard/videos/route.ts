import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/dashboard/videos - Get all videos for the current user (including drafts)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const videos = await prisma.video.findMany({
      where: {
        uploaderId: session.user.id,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        thumbnailUrl: true,
        duration: true,
        viewCount: true,
        likeCount: true,
        commentCount: true,
        createdAt: true,
        publishedAt: true,
        scheduledPublishAt: true,
        game: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ videos })
  } catch (error) {
    console.error('Dashboard videos error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    )
  }
}
