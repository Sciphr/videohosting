import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const video = formData.get('video') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const videoType = formData.get('videoType') as 'CLIP' | 'FULL'
    const gameTitle = formData.get('gameTitle') as string

    if (!video || !title) {
      return NextResponse.json(
        { error: 'Video and title are required' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!video.type.startsWith('video/')) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      )
    }

    // Validate file size (500MB max)
    const maxSize = 524288000
    if (video.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 500MB' },
        { status: 400 }
      )
    }

    // Create upload directory
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'videos')
    await mkdir(uploadDir, { recursive: true })

    // Generate unique filename
    const ext = video.name.split('.').pop() || 'mp4'
    const filename = `${uuidv4()}.${ext}`
    const filepath = join(uploadDir, filename)

    // Save file
    const bytes = await video.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Get video duration (simplified - in production use ffprobe)
    // For now, we'll estimate based on file size
    const estimatedDuration = Math.floor(video.size / 100000) // rough estimate

    // Create database entry
    const videoRecord = await prisma.video.create({
      data: {
        title,
        description: description || null,
        filePath: `/uploads/videos/${filename}`,
        duration: estimatedDuration,
        videoType: videoType || 'CLIP',
        gameTitle: gameTitle || null,
        userId: session.user.id
      },
      include: {
        user: true
      }
    })

    return NextResponse.json({
      message: 'Video uploaded successfully',
      video: videoRecord
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload video' },
      { status: 500 }
    )
  }
}

export const config = {
  api: {
    bodyParser: false
  }
}
