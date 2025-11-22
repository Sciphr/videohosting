import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/streams - List live streams
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'LIVE'
    const gameId = searchParams.get('gameId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Record<string, unknown> = {}

    if (status === 'LIVE') {
      where.status = 'LIVE'
    } else if (status === 'ALL') {
      // No status filter
    } else {
      where.status = status
    }

    if (gameId) {
      where.gameId = gameId
    }

    const [streams, total] = await Promise.all([
      prisma.stream.findMany({
        where,
        include: {
          user: {
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
              slug: true,
              coverImageUrl: true,
            }
          }
        },
        orderBy: [
          { viewerCount: 'desc' },
          { startedAt: 'desc' },
        ],
        take: limit,
        skip: offset,
      }),
      prisma.stream.count({ where })
    ])

    return NextResponse.json({
      streams,
      total,
      hasMore: offset + streams.length < total,
    })
  } catch (error) {
    console.error('List streams error:', error)
    return NextResponse.json(
      { error: 'Failed to list streams' },
      { status: 500 }
    )
  }
}
