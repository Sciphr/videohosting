import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const type = searchParams.get('type') // 'videos', 'users', 'games', or 'all'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!query || query.trim() === '') {
      return NextResponse.json({
        videos: [],
        users: [],
        games: [],
      })
    }

    const searchTerm = query.trim()
    const shouldSearchVideos = !type || type === 'all' || type === 'videos'
    const shouldSearchUsers = !type || type === 'all' || type === 'users'
    const shouldSearchGames = !type || type === 'all' || type === 'games'

    const results: any = {}

    // Search videos
    if (shouldSearchVideos) {
      results.videos = await prisma.video.findMany({
        where: {
          AND: [
            {
              OR: [
                { title: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } },
                {
                  tags: {
                    some: {
                      tag: {
                        name: { contains: searchTerm, mode: 'insensitive' }
                      }
                    }
                  }
                },
                {
                  game: {
                    name: { contains: searchTerm, mode: 'insensitive' }
                  }
                }
              ]
            },
            { status: 'READY' },
            { deletedAt: null }
          ]
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
          viewCount: 'desc'
        },
        take: limit,
        skip: offset,
      })
    }

    // Search users
    if (shouldSearchUsers) {
      results.users = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: searchTerm, mode: 'insensitive' } },
            { displayName: { contains: searchTerm, mode: 'insensitive' } },
          ]
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          _count: {
            select: {
              videos: true,
              followers: true,
            }
          }
        },
        take: limit,
        skip: offset,
      })
    }

    // Search games
    if (shouldSearchGames) {
      results.games = await prisma.game.findMany({
        where: {
          name: { contains: searchTerm, mode: 'insensitive' }
        },
        include: {
          _count: {
            select: {
              videos: true,
            }
          }
        },
        take: limit,
        skip: offset,
      })
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Failed to search' },
      { status: 500 }
    )
  }
}
