import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execPromise = promisify(exec)

interface ClipOptions {
  inputPath: string
  outputPath: string
  startTime: number
  endTime: number
}

/**
 * Extract a clip from a video using FFmpeg
 * Uses stream copy (-c copy) for fast extraction without re-encoding
 * @param options Clip extraction options
 * @returns Path to the generated clip
 */
export async function extractClip(options: ClipOptions): Promise<string> {
  const { inputPath, outputPath, startTime, endTime } = options

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // Build FFmpeg command
  // -ss: start time
  // -to: end time
  // -i: input file
  // -c copy: stream copy (no re-encoding, very fast)
  // -avoid_negative_ts make_zero: handle timestamp issues
  const command = `ffmpeg -ss ${startTime} -to ${endTime} -i "${inputPath}" -c copy -avoid_negative_ts make_zero "${outputPath}"`

  try {
    console.log(`Running FFmpeg command: ${command}`)
    const { stdout, stderr } = await execPromise(command)
    
    if (stderr) {
      console.log('FFmpeg stderr:', stderr)
    }
    
    // Check if output file was created
    if (!fs.existsSync(outputPath)) {
      throw new Error('FFmpeg did not create output file')
    }

    const stats = fs.statSync(outputPath)
    if (stats.size === 0) {
      throw new Error('FFmpeg created empty file')
    }

    console.log(`Clip created successfully: ${outputPath} (${stats.size} bytes)`)
    return outputPath
  } catch (error) {
    console.error('FFmpeg error:', error)
    throw new Error(`FFmpeg clip extraction failed: ${error.message}`)
  }
}

/**
 * Get video duration using FFprobe
 * @param videoPath Path to the video file
 * @returns Duration in seconds
 */
export async function getVideoDuration(videoPath: string): Promise<number> {
  const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`

  try {
    const { stdout } = await execPromise(command)
    const duration = parseFloat(stdout.trim())
    
    if (isNaN(duration)) {
      throw new Error('Invalid duration returned from ffprobe')
    }

    return duration
  } catch (error) {
    console.error('FFprobe error:', error)
    throw new Error(`Failed to get video duration: ${error.message}`)
  }
}

/**
 * Generate a thumbnail from a video at a specific timestamp
 * @param videoPath Path to the video file
 * @param outputPath Path where thumbnail should be saved
 * @param timestamp Time in seconds to capture the thumbnail (default: 1)
 */
export async function generateThumbnail(
  videoPath: string,
  outputPath: string,
  timestamp: number = 1
): Promise<string> {
  const outputDir = path.dirname(outputPath)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const command = `ffmpeg -ss ${timestamp} -i "${videoPath}" -frames:v 1 -q:v 2 "${outputPath}"`

  try {
    await execPromise(command)
    
    if (!fs.existsSync(outputPath)) {
      throw new Error('Thumbnail file was not created')
    }

    return outputPath
  } catch (error) {
    console.error('Thumbnail generation error:', error)
    throw new Error(`Failed to generate thumbnail: ${error.message}`)
  }
}

/**
 * Check if FFmpeg is installed and available
 */
export async function checkFFmpegAvailability(): Promise<boolean> {
  try {
    await execPromise('ffmpeg -version')
    return true
  } catch (error) {
    console.error('FFmpeg not available:', error)
    return false
  }
}
