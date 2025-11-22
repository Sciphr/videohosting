import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadToMinIO, deleteFromMinIO } from '@/lib/minio'
import { writeFile, mkdir } from 'fs/promises'
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

// POST /api/users/[id]/avatar - Upload avatar image
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let tempDir: string | null = null

  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Only allow updating own profile
    if (session.user.id !== id) {
      return NextResponse.json(
        { error: 'Not authorized to update this profile' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB for avatars)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB' },
        { status: 400 }
      )
    }

    // Get current user to check for existing avatar
    const user = await prisma.user.findUnique({
      where: { id },
      select: { avatarUrl: true }
    })

    // Create temp directory
    const tempId = randomUUID()
    tempDir = path.join(process.cwd(), 'tmp', tempId)
    await mkdir(tempDir, { recursive: true })

    // Save file temporarily
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const ext = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1]
    const tempFilePath = path.join(tempDir, `avatar.${ext}`)
    await writeFile(tempFilePath, buffer)

    // Upload to MinIO
    const avatarKey = `avatars/${id}-${Date.now()}.${ext}`
    const avatarUrl = await uploadToMinIO(tempFilePath, avatarKey, file.type)

    // Delete old avatar if exists (and it's in MinIO)
    if (user?.avatarUrl && user.avatarUrl.includes('avatars/')) {
      try {
        const oldKey = user.avatarUrl.split('/').slice(-2).join('/')
        await deleteFromMinIO(oldKey)
      } catch (err) {
        console.error('Failed to delete old avatar:', err)
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { avatarUrl },
      select: {
        id: true,
        avatarUrl: true,
      }
    })

    // Cleanup temp files
    fs.rmSync(tempDir, { recursive: true, force: true })

    return NextResponse.json({
      success: true,
      avatarUrl: updatedUser.avatarUrl
    })
  } catch (error) {
    console.error('Avatar upload error:', error)

    // Cleanup on error
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }

    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id]/avatar - Remove avatar
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    if (session.user.id !== id) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      )
    }

    // Get current avatar
    const user = await prisma.user.findUnique({
      where: { id },
      select: { avatarUrl: true }
    })

    // Delete from MinIO if exists
    if (user?.avatarUrl && user.avatarUrl.includes('avatars/')) {
      try {
        const oldKey = user.avatarUrl.split('/').slice(-2).join('/')
        await deleteFromMinIO(oldKey)
      } catch (err) {
        console.error('Failed to delete avatar:', err)
      }
    }

    // Update user
    await prisma.user.update({
      where: { id },
      data: { avatarUrl: null }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Avatar delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete avatar' },
      { status: 500 }
    )
  }
}
