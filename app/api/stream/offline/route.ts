import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/stream/offline - Mark stream as offline (called by media server)
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

    // Update peak viewer count if current is higher
    const peakViewerCount = Math.max(stream.peakViewerCount, stream.viewerCount)

    await prisma.stream.update({
      where: { id: stream.id },
      data: {
        status: 'OFFLINE',
        hlsUrl: null,
        endedAt: new Date(),
        viewerCount: 0,
        peakViewerCount,
      }
    })

    console.log(`[Stream] ${stream.title} is now OFFLINE`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mark stream offline error:', error)
    return NextResponse.json(
      { error: 'Failed to mark stream as offline' },
      { status: 500 }
    )
  }
}
