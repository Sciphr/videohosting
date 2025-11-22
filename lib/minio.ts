import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { Readable } from 'stream'
import fs from 'fs'
import path from 'path'

export const s3Client = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  },
  forcePathStyle: true,
})

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'videohosting'

/**
 * Download a file from MinIO to local filesystem
 * @param s3Key The S3 key (path) of the file in MinIO
 * @param localPath The local filesystem path where the file should be saved
 */
export async function downloadFromMinIO(s3Key: string, localPath: string): Promise<void> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    })

    const response = await s3Client.send(command)
    
    if (!response.Body) {
      throw new Error('No body in S3 response')
    }

    // Ensure directory exists
    const dir = path.dirname(localPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    // Write stream to file
    const writeStream = fs.createWriteStream(localPath)
    
    if (response.Body instanceof Readable) {
      await new Promise((resolve, reject) => {
        response.Body.pipe(writeStream)
          .on('finish', resolve)
          .on('error', reject)
      })
    } else {
      // If it's not a readable stream, convert to buffer
      const buffer = await response.Body.transformToByteArray()
      fs.writeFileSync(localPath, buffer)
    }
  } catch (error) {
    console.error('Error downloading from MinIO:', error)
    throw new Error(`Failed to download file from MinIO: ${error.message}`)
  }
}

/**
 * Upload a file from local filesystem to MinIO
 * @param localPath The local filesystem path of the file to upload
 * @param s3Key The S3 key (path) where the file should be stored in MinIO
 * @param contentType Optional content type (e.g., 'video/mp4')
 * @returns The full URL to access the file
 */
export async function uploadToMinIO(
  localPath: string,
  s3Key: string,
  contentType: string = 'video/mp4'
): Promise<string> {
  try {
    const fileContent = fs.readFileSync(localPath)

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: fileContent,
      ContentType: contentType,
    })

    await s3Client.send(command)

    // Construct the URL
    const endpoint = process.env.MINIO_ENDPOINT || 'http://localhost:9000'
    return `${endpoint}/${BUCKET_NAME}/${s3Key}`
  } catch (error) {
    console.error('Error uploading to MinIO:', error)
    throw new Error(`Failed to upload file to MinIO: ${error.message}`)
  }
}

/**
 * Delete a file from MinIO
 * @param s3Key The S3 key (path) of the file to delete
 */
export async function deleteFromMinIO(s3Key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    })

    await s3Client.send(command)
  } catch (error) {
    console.error('Error deleting from MinIO:', error)
    throw new Error(`Failed to delete file from MinIO: ${error.message}`)
  }
}

/**
 * Extract the S3 key from a full MinIO URL
 * @param url The full MinIO URL (e.g., 'http://localhost:9000/videohosting/videos/abc.mp4')
 * @returns The S3 key (e.g., 'videos/abc.mp4')
 */
export function extractS3KeyFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    // Remove the leading slash and bucket name
    const pathParts = urlObj.pathname.split('/').filter(p => p)
    // First part is bucket name, rest is the key
    if (pathParts.length > 1) {
      return pathParts.slice(1).join('/')
    }
    return pathParts.join('/')
  } catch (error) {
    // If URL parsing fails, assume it's already just a key
    return url
  }
}
