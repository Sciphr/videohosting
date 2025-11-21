import { NextRequest, NextResponse } from 'next/server'
import { Readable } from 'stream'
import { prisma } from '@/lib/prisma'
import { s3Client } from '@/lib/minio'
import { GetObjectCommand } from '@aws-sdk/client-s3'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get video from database
    const video = await prisma.video.findUnique({
      where: { id },
      select: { fileKey: true }
    })

    if (!video || !video.fileKey) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    // Get object from MinIO using S3 client with proper credentials
    const command = new GetObjectCommand({
      Bucket: process.env.MINIO_BUCKET_NAME || 'videohosting',
      Key: video.fileKey,
    })

    const response = await s3Client.send(command)
    const body = response.Body

    if (!body) {
      return NextResponse.json(
        { error: 'No video content' },
        { status: 404 }
      )
    }

    // Convert AWS SDK stream to Node.js Readable stream
    const nodeStream = Readable.from(body as any)

    // Return as streaming response with proper headers
    return new NextResponse(nodeStream as any, {
      status: 200,
      headers: {
        'Content-Type': response.ContentType || 'video/mp4',
        'Content-Length': response.ContentLength?.toString() || '',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Stream error:', error)
    return NextResponse.json(
      { error: 'Failed to stream video' },
      { status: 500 }
    )
  }
}
