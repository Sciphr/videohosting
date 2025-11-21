import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadToMinIO } from '@/lib/minio'
import { generateThumbnail, getVideoDuration } from '@/lib/ffmpeg'
import { writeFile, mkdir } from 'fs/promises'
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

// Configure route for 5-minute processing timeout
export const maxDuration = 300

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const videoType = formData.get('videoType') as 'CLIP' | 'FULL'
    const gameId = formData.get('gameId') as string | null
    const tags = formData.get('tags') as string // JSON string array

    // Validate file
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only MP4, MOV, AVI, and WebM are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (max 500MB - Next.js limit)
    const maxSize = 500 * 1024 * 1024 // 500MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 500MB' },
        { status: 400 }
      )
    }

    // Validate metadata
    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    if (!videoType || (videoType !== 'CLIP' && videoType !== 'FULL')) {
      return NextResponse.json(
        { error: 'Invalid video type' },
        { status: 400 }
      )
    }

    const videoId = randomUUID()
    const tempDir = path.join(process.cwd(), 'tmp', videoId)

    try {
      // Create temp directory
      await mkdir(tempDir, { recursive: true })

      // Save uploaded file to temp
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      const fileExtension = path.extname(file.name) || '.mp4'
      const tempVideoPath = path.join(tempDir, `video${fileExtension}`)
      await writeFile(tempVideoPath, buffer)

      console.log(`Processing upload ${videoId}: detecting duration...`)

      // Get video duration
      const duration = await getVideoDuration(tempVideoPath)

      console.log(`Processing upload ${videoId}: generating thumbnail...`)

      // Generate thumbnail (at 1 second or 10% of duration)
      const thumbnailTimestamp = Math.min(1, duration * 0.1)
      const tempThumbnailPath = path.join(tempDir, 'thumbnail.jpg')
      await generateThumbnail(tempVideoPath, tempThumbnailPath, thumbnailTimestamp)

      console.log(`Processing upload ${videoId}: uploading to MinIO...`)

      // Upload video to MinIO
      const videoS3Key = `videos/${videoId}${fileExtension}`
      const videoUrl = await uploadToMinIO(tempVideoPath, videoS3Key, file.type)

      // Upload thumbnail to MinIO
      const thumbnailS3Key = `thumbnails/${videoId}.jpg`
      const thumbnailUrl = await uploadToMinIO(tempThumbnailPath, thumbnailS3Key, 'image/jpeg')

      console.log(`Processing upload ${videoId}: creating database entry...`)

      // Parse tags
      let tagNames: string[] = []
      try {
        if (tags) {
          tagNames = JSON.parse(tags)
        }
      } catch (e) {
        console.error('Failed to parse tags:', e)
      }

      // Create video entry in database
      const video = await prisma.video.create({
        data: {
          id: videoId,
          title: title.trim(),
          description: description?.trim() || null,
          uploaderId: session.user.id,
          videoType: videoType,
          fileUrl: videoUrl,
          thumbnailUrl: thumbnailUrl,
          duration: duration,
          gameId: gameId || null,
          status: 'READY',
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
          game: true,
        }
      })

      // Create tags if provided
      if (tagNames.length > 0) {
        for (const tagName of tagNames) {
          const trimmedTag = tagName.trim()
          if (trimmedTag) {
            // Find or create tag
            let tag = await prisma.tag.findFirst({
              where: { name: trimmedTag }
            })

            if (!tag) {
              tag = await prisma.tag.create({
                data: {
                  name: trimmedTag,
                  type: 'CUSTOM'
                }
              })
            }

            // Associate tag with video
            await prisma.videoTag.create({
              data: {
                videoId: video.id,
                tagId: tag.id
              }
            })
          }
        }
      }

      console.log(`Processing upload ${videoId}: cleaning up temp files...`)

      // Clean up temp files
      fs.rmSync(tempDir, { recursive: true, force: true })

      console.log(`Upload ${videoId} completed successfully!`)

      return NextResponse.json({
        success: true,
        video: video
      }, { status: 201 })

    } catch (processingError) {
      console.error('Upload processing error:', processingError)
      
      // Clean up temp files on error
      try {
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true })
        }
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError)
      }

      throw processingError
    }

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload video. Please try again.' },
      { status: 500 }
    )
  }
}
