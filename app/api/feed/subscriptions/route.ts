import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/feed/subscriptions - Get videos from followed users
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type') // CLIP, FULL, or null for all

    // Get list of followed user IDs
    const following = await prisma.follow.findMany({
      where: { followerId: session.user.id },
      select: { followingId: true },
    })

    const followedUserIds = following.map(f => f.followingId)

    if (followedUserIds.length === 0) {
      return NextResponse.json({
        videos: [],
        followedUsers: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      })
    }

    // Get videos from followed users
    const [videos, total, followedUsers] = await Promise.all([
      prisma.video.findMany({
        where: {
          uploaderId: { in: followedUserIds },
          status: 'READY',
          isPublic: true,
          deletedAt: null,
          ...(type && { videoType: type as any }),
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
          game: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.video.count({
        where: {
          uploaderId: { in: followedUserIds },
          status: 'READY',
          isPublic: true,
          deletedAt: null,
          ...(type && { videoType: type as any }),
        },
      }),
      prisma.user.findMany({
        where: { id: { in: followedUserIds } },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          _count: {
            select: { videos: true },
          },
        },
        orderBy: { displayName: 'asc' },
      }),
    ])

    return NextResponse.json({
      videos,
      followedUsers: followedUsers.map(u => ({
        ...u,
        videoCount: u._count.videos,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching subscription feed:', error)
    return NextResponse.json({ error: 'Failed to fetch subscription feed' }, { status: 500 })
  }
}
