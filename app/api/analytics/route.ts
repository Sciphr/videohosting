import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Get all videos for the user
    const userVideos = await prisma.video.findMany({
      where: {
        uploaderId: userId,
        deletedAt: null
      },
      include: {
        _count: {
          select: {
            likes: true,
            comments: true,
            clips: true
          }
        },
        game: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate totals
    const totalStats = userVideos.reduce((acc, video) => ({
      totalViews: acc.totalViews + video.viewCount,
      totalLikes: acc.totalLikes + video._count.likes,
      totalComments: acc.totalComments + video._count.comments,
      totalClipsCreated: acc.totalClipsCreated + video._count.clips,
      totalVideos: acc.totalVideos + 1
    }), {
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalClipsCreated: 0,
      totalVideos: 0
    })

    // Get top performing videos
    const topVideos = [...userVideos]
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 10)
      .map(video => ({
        id: video.id,
        title: video.title,
        viewCount: video.viewCount,
        likeCount: video._count.likes,
        commentCount: video._count.comments,
        clipCount: video._count.clips,
        game: video.game,
        createdAt: video.createdAt
      }))

    // Get recent activity (views from last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // First get all video IDs for this user
    const userVideoIds = await prisma.video.findMany({
      where: {
        uploaderId: userId,
        deletedAt: null
      },
      select: {
        id: true
      }
    })

    const videoIds = userVideoIds.map(v => v.id)

    // Then get views for those videos
    const recentViews = await prisma.videoView.groupBy({
      by: ['createdAt'],
      where: {
        videoId: {
          in: videoIds
        },
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Group views by date for chart data
    const viewsByDate: { [key: string]: number } = {}
    recentViews.forEach(view => {
      const date = new Date(view.createdAt).toISOString().split('T')[0]
      viewsByDate[date] = (viewsByDate[date] || 0) + view._count.id
    })

    const chartData = Object.entries(viewsByDate).map(([date, count]) => ({
      date,
      views: count
    }))

    return NextResponse.json({
      totalStats,
      topVideos,
      chartData,
      videoCount: userVideos.length
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
