import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const games = await prisma.game.findMany({
      orderBy: {
        name: 'asc'
      },
      include: {
        _count: {
          select: {
            videos: true
          }
        }
      }
    })

    return NextResponse.json(games)
  } catch (error) {
    console.error('Get games error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description, coverImageUrl } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Game name is required' },
        { status: 400 }
      )
    }

    // Check if game already exists
    const existingGame = await prisma.game.findUnique({
      where: { name: name.trim() }
    })

    if (existingGame) {
      return NextResponse.json(
        { error: 'Game already exists' },
        { status: 409 }
      )
    }

    const game = await prisma.game.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        coverImageUrl: coverImageUrl?.trim() || null,
      }
    })

    return NextResponse.json(game, { status: 201 })
  } catch (error) {
    console.error('Create game error:', error)
    return NextResponse.json(
      { error: 'Failed to create game' },
      { status: 500 }
    )
  }
}
