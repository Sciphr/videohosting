/**
 * Node Media Server - RTMP to HLS Streaming
 *
 * This server accepts RTMP streams from OBS/Streamlabs and converts them to HLS
 * for playback in browsers. Runs as a separate process alongside Next.js.
 *
 * Usage: node media-server/index.js
 */

const NodeMediaServer = require('node-media-server')
const path = require('path')
const fs = require('fs')

// Configuration
const config = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60,
  },
  http: {
    port: 8000,
    mediaroot: path.join(__dirname, 'media'),
    allow_origin: '*',
  },
  trans: {
    ffmpeg: '/usr/bin/ffmpeg',
    tasks: [
      {
        app: 'live',
        hls: true,
        hlsFlags: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]',
        hlsKeep: false, // Don't keep HLS files after stream ends
        // No transcoding - passthrough mode for Pi compatibility
        // The stream is simply repackaged from RTMP to HLS
      },
    ],
  },
  auth: {
    // Auth will be handled via API callbacks
    play: false,
    publish: false,
  },
}

// Ensure media directory exists
const mediaRoot = path.join(__dirname, 'media')
if (!fs.existsSync(mediaRoot)) {
  fs.mkdirSync(mediaRoot, { recursive: true })
}

const nms = new NodeMediaServer(config)

// API URL for callbacks (your Next.js app)
const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000'

// Event handlers
nms.on('preConnect', (id, args) => {
  console.log('[NodeMediaServer] Client connecting:', id, args)
})

nms.on('postConnect', (id, args) => {
  console.log('[NodeMediaServer] Client connected:', id)
})

nms.on('doneConnect', (id, args) => {
  console.log('[NodeMediaServer] Client disconnected:', id)
})

nms.on('prePublish', async (id, StreamPath, args) => {
  console.log('[NodeMediaServer] Stream starting:', id, StreamPath)

  // StreamPath format: /live/STREAM_KEY
  const streamKey = StreamPath.split('/')[2]

  if (!streamKey) {
    console.log('[NodeMediaServer] No stream key provided, rejecting')
    const session = nms.getSession(id)
    session.reject()
    return
  }

  // Validate stream key with API
  try {
    const response = await fetch(`${API_BASE}/api/stream/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ streamKey }),
    })

    if (!response.ok) {
      console.log('[NodeMediaServer] Invalid stream key, rejecting')
      const session = nms.getSession(id)
      session.reject()
      return
    }

    console.log('[NodeMediaServer] Stream key valid, allowing publish')
  } catch (error) {
    console.error('[NodeMediaServer] Error validating stream key:', error)
    // Allow on error (fail open for development, change to reject for production)
  }
})

nms.on('postPublish', async (id, StreamPath, args) => {
  console.log('[NodeMediaServer] Stream live:', StreamPath)

  const streamKey = StreamPath.split('/')[2]

  // Notify API that stream is live
  try {
    await fetch(`${API_BASE}/api/stream/live`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        streamKey,
        hlsUrl: `http://localhost:8000/live/${streamKey}/index.m3u8`
      }),
    })
  } catch (error) {
    console.error('[NodeMediaServer] Error notifying stream live:', error)
  }
})

nms.on('donePublish', async (id, StreamPath, args) => {
  console.log('[NodeMediaServer] Stream ended:', StreamPath)

  const streamKey = StreamPath.split('/')[2]

  // Notify API that stream ended
  try {
    await fetch(`${API_BASE}/api/stream/offline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ streamKey }),
    })
  } catch (error) {
    console.error('[NodeMediaServer] Error notifying stream offline:', error)
  }
})

nms.on('prePlay', (id, StreamPath, args) => {
  console.log('[NodeMediaServer] Viewer connecting:', id, StreamPath)
})

nms.on('postPlay', (id, StreamPath, args) => {
  console.log('[NodeMediaServer] Viewer watching:', id, StreamPath)
})

nms.on('donePlay', (id, StreamPath, args) => {
  console.log('[NodeMediaServer] Viewer left:', id, StreamPath)
})

// Start server
nms.run()

console.log('='.repeat(50))
console.log('Node Media Server Started')
console.log('='.repeat(50))
console.log(`RTMP: rtmp://localhost:1935/live/YOUR_STREAM_KEY`)
console.log(`HLS:  http://localhost:8000/live/YOUR_STREAM_KEY/index.m3u8`)
console.log('='.repeat(50))
