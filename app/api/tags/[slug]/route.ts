import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/tags/[slug] - Get videos for a specific tag
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type') // Optional tag type filter

    // Find the tag
    const tag = await prisma.tag.findFirst({
      where: {
        slug,
        ...(type && { type: type as any }),
      },
    })

    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }

    // Get videos with this tag
    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where: {
          tags: {
            some: {
              tagId: tag.id,
            },
          },
          status: 'READY',
          isPublic: true,
          deletedAt: null,
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
          tags: {
            some: {
              tagId: tag.id,
            },
          },
          status: 'READY',
          isPublic: true,
          deletedAt: null,
        },
      }),
    ])

    return NextResponse.json({
      tag,
      videos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching tag videos:', error)
    return NextResponse.json({ error: 'Failed to fetch tag videos' }, { status: 500 })
  }
}
