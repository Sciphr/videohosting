import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/stream/validate - Validate stream key (called by media server)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { streamKey } = body

    if (!streamKey) {
      return NextResponse.json(
        { error: 'Stream key required' },
        { status: 400 }
      )
    }

    const stream = await prisma.stream.findUnique({
      where: { streamKey }
    })

    if (!stream) {
      return NextResponse.json(
        { error: 'Invalid stream key' },
        { status: 404 }
      )
    }

    return NextResponse.json({ valid: true, userId: stream.userId })
  } catch (error) {
    console.error('Validate stream key error:', error)
    return NextResponse.json(
      { error: 'Failed to validate stream key' },
      { status: 500 }
    )
  }
}
