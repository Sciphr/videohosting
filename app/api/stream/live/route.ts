import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/stream/live - Mark stream as live (called by media server)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { streamKey, hlsUrl } = body

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

    await prisma.stream.update({
      where: { id: stream.id },
      data: {
        status: 'LIVE',
        hlsUrl: hlsUrl || null,
        startedAt: new Date(),
        viewerCount: 0,
      }
    })

    console.log(`[Stream] ${stream.title} is now LIVE`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mark stream live error:', error)
    return NextResponse.json(
      { error: 'Failed to mark stream as live' },
      { status: 500 }
    )
  }
}
