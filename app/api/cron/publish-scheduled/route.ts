import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/cron/publish-scheduled - Auto-publish videos that are due
// This should be called by a cron job (e.g., every minute)
// You can also add a secret token check for security
export async function GET(request: NextRequest) {
  try {
    // Optional: Check for a secret token in headers for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // If CRON_SECRET is set, require it
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const now = new Date()

    // Find all scheduled videos that should be published
    const videosToPublish = await prisma.video.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledPublishAt: {
          lte: now,
        },
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        scheduledPublishAt: true,
      },
    })

    if (videosToPublish.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No videos to publish',
        published: 0,
      })
    }

    // Publish all due videos
    const result = await prisma.video.updateMany({
      where: {
        id: {
          in: videosToPublish.map(v => v.id),
        },
      },
      data: {
        status: 'READY',
        publishedAt: now,
        scheduledPublishAt: null,
      },
    })

    console.log(`Auto-published ${result.count} videos:`, videosToPublish.map(v => v.title))

    return NextResponse.json({
      success: true,
      message: `Published ${result.count} videos`,
      published: result.count,
      videos: videosToPublish.map(v => ({ id: v.id, title: v.title })),
    })
  } catch (error) {
    console.error('Cron publish error:', error)
    return NextResponse.json(
      { error: 'Failed to run scheduled publish' },
      { status: 500 }
    )
  }
}
