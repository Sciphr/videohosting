import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/streams/[id]/chat - Get chat messages for a stream
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if this is a stream ID or username
    let streamId = id

    // If it doesn't look like a cuid, try to find stream by user
    if (!id.match(/^c[a-z0-9]{24}$/)) {
      const user = await prisma.user.findUnique({
        where: { username: id },
        select: { id: true }
      })

      if (user) {
        const stream = await prisma.stream.findFirst({
          where: { userId: user.id },
          select: { id: true }
        })
        if (stream) {
          streamId = stream.id
        }
      }
    }

    const messages = await prisma.streamChat.findMany({
      where: { streamId },
      orderBy: { createdAt: 'asc' },
      take: 100, // Last 100 messages
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Get stream chat error:', error)
    return NextResponse.json(
      { error: 'Failed to get chat messages' },
      { status: 500 }
    )
  }
}

// POST /api/streams/[id]/chat - Send a chat message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    // Check if this is a stream ID or username
    let streamId = id

    if (!id.match(/^c[a-z0-9]{24}$/)) {
      const user = await prisma.user.findUnique({
        where: { username: id },
        select: { id: true }
      })

      if (user) {
        const stream = await prisma.stream.findFirst({
          where: { userId: user.id },
          select: { id: true }
        })
        if (stream) {
          streamId = stream.id
        }
      }
    }

    // Verify stream exists and is live
    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      select: { status: true }
    })

    if (!stream) {
      return NextResponse.json(
        { error: 'Stream not found' },
        { status: 404 }
      )
    }

    if (stream.status !== 'LIVE') {
      return NextResponse.json(
        { error: 'Chat is only available during live streams' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { message } = body

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    if (message.length > 500) {
      return NextResponse.json(
        { error: 'Message too long (max 500 characters)' },
        { status: 400 }
      )
    }

    // Get username (from session or anonymous)
    let username = 'Anonymous'
    let userId: string | null = null

    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { username: true, displayName: true }
      })
      if (user) {
        username = user.displayName || user.username
        userId = session.user.id
      }
    }

    const chatMessage = await prisma.streamChat.create({
      data: {
        message: message.trim(),
        username,
        userId,
        streamId,
      },
    })

    return NextResponse.json(chatMessage, { status: 201 })
  } catch (error) {
    console.error('Send chat message error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
