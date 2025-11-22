import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// POST /api/playlists/[id]/videos - Add a video to playlist
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: playlistId } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
      include: { videos: true },
    })

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 })
    }

    if (playlist.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { videoId } = body

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 })
    }

    // Check if video exists
    const video = await prisma.video.findUnique({
      where: { id: videoId },
    })

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Check if video is already in playlist
    const existingEntry = await prisma.playlistVideo.findUnique({
      where: {
        playlistId_videoId: {
          playlistId,
          videoId,
        },
      },
    })

    if (existingEntry) {
      return NextResponse.json({ error: 'Video already in playlist' }, { status: 400 })
    }

    // Get the next position
    const maxPosition = playlist.videos.reduce((max, v) => Math.max(max, v.position), -1)

    // Add video to playlist
    const playlistVideo = await prisma.playlistVideo.create({
      data: {
        playlistId,
        videoId,
        position: maxPosition + 1,
      },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
            duration: true,
          },
        },
      },
    })

    // Update playlist video count and thumbnail
    await prisma.playlist.update({
      where: { id: playlistId },
      data: {
        videoCount: { increment: 1 },
        // Set thumbnail to first video's thumbnail if not set
        ...(playlist.videoCount === 0 && video.thumbnailUrl && {
          thumbnailUrl: video.thumbnailUrl,
        }),
      },
    })

    return NextResponse.json(playlistVideo, { status: 201 })
  } catch (error) {
    console.error('Error adding video to playlist:', error)
    return NextResponse.json({ error: 'Failed to add video to playlist' }, { status: 500 })
  }
}

// DELETE /api/playlists/[id]/videos - Remove a video from playlist
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: playlistId } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
    })

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 })
    }

    if (playlist.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('videoId')

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 })
    }

    // Remove video from playlist
    await prisma.playlistVideo.delete({
      where: {
        playlistId_videoId: {
          playlistId,
          videoId,
        },
      },
    })

    // Update playlist video count
    await prisma.playlist.update({
      where: { id: playlistId },
      data: {
        videoCount: { decrement: 1 },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing video from playlist:', error)
    return NextResponse.json({ error: 'Failed to remove video from playlist' }, { status: 500 })
  }
}

// PATCH /api/playlists/[id]/videos - Reorder videos in playlist
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: playlistId } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
    })

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 })
    }

    if (playlist.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { videoIds } = body // Array of video IDs in new order

    if (!Array.isArray(videoIds)) {
      return NextResponse.json({ error: 'videoIds must be an array' }, { status: 400 })
    }

    // Update positions
    await Promise.all(
      videoIds.map((videoId, index) =>
        prisma.playlistVideo.updateMany({
          where: {
            playlistId,
            videoId,
          },
          data: {
            position: index,
          },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering playlist videos:', error)
    return NextResponse.json({ error: 'Failed to reorder videos' }, { status: 500 })
  }
}
