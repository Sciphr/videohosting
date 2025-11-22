'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

// Import all player variations
import ModernVideoPlayer from '@/components/players/ModernVideoPlayer'
import PlyrVideoPlayer from '@/components/players/PlyrVideoPlayer'
import CustomVideoPlayer from '@/components/players/CustomVideoPlayer'
import MediaChromePlayer from '@/components/players/MediaChromePlayer'
import VideoPlayer from '@/components/VideoPlayer'
import InlineClipCreator from '@/components/InlineClipCreator'

interface Video {
  id: string
  title: string
  fileUrl: string
  thumbnailUrl?: string
  duration?: number
}

const playerOptions = [
  {
    id: 'original',
    name: 'Original (Video.js)',
    description: 'The current video.js player',
    color: 'blue',
  },
  {
    id: 'modern',
    name: 'Modern Glassmorphism',
    description: 'Sleek glassmorphism UI with blur effects and gradient progress',
    color: 'cyan',
  },
  {
    id: 'plyr',
    name: 'Plyr Player',
    description: 'Clean, minimal design with excellent accessibility',
    color: 'cyan',
  },
  {
    id: 'custom',
    name: 'Custom Cinema',
    description: 'Cinema-style floating controls with violet theme',
    color: 'violet',
  },
  {
    id: 'mediachrome',
    name: 'Media Chrome',
    description: 'Modern web components with emerald theme',
    color: 'emerald',
  },
]

function PlayerDemoContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const videoId = searchParams.get('v')

  const [video, setVideo] = useState<Video | null>(null)
  const [loading, setLoading] = useState(true)
  const [activePlayer, setActivePlayer] = useState('modern')
  const [showClipCreator, setShowClipCreator] = useState(false)
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [videos, setVideos] = useState<Video[]>([])

  // Fetch available videos if no video ID provided
  useEffect(() => {
    async function fetchVideos() {
      try {
        const res = await fetch('/api/videos?limit=10')
        if (res.ok) {
          const data = await res.json()
          setVideos(data.videos || [])

          // If no video selected, redirect to first video
          if (!videoId && data.videos?.length > 0) {
            router.push(`/player-demo?v=${data.videos[0].id}`)
          }
        }
      } catch (err) {
        console.error('Failed to fetch videos:', err)
      }
    }

    fetchVideos()
  }, [videoId, router])

  // Fetch selected video details
  useEffect(() => {
    async function fetchVideo() {
      if (!videoId) {
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/videos/${videoId}`)
        if (res.ok) {
          const data = await res.json()
          setVideo(data)
          setDuration(data.duration || 0)
        }
      } catch (err) {
        console.error('Failed to fetch video:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchVideo()
  }, [videoId])

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time)
  }

  const handlePlayerReady = (element: HTMLVideoElement) => {
    setVideoElement(element)
    if (element.duration) {
      setDuration(element.duration)
    }
  }

  const renderPlayer = () => {
    if (!video) return null

    const src = `/api/videos/${video.id}/stream`
    const poster = video.thumbnailUrl

    switch (activePlayer) {
      case 'original':
        return (
          <VideoPlayer
            src={src}
            poster={poster}
            videoId={video.id}
            onTimeUpdate={handleTimeUpdate}
            onPlayerReady={(player) => {
              const el = player.el()?.querySelector('video') as HTMLVideoElement
              if (el) handlePlayerReady(el)
            }}
          />
        )
      case 'modern':
        return (
          <ModernVideoPlayer
            src={src}
            poster={poster}
            videoId={video.id}
            onTimeUpdate={handleTimeUpdate}
            onPlayerReady={handlePlayerReady}
          />
        )
      case 'plyr':
        return (
          <PlyrVideoPlayer
            src={src}
            poster={poster}
            videoId={video.id}
            onTimeUpdate={handleTimeUpdate}
            onPlayerReady={(player) => {
              // Plyr exposes the media element
              const media = player.media as HTMLVideoElement
              if (media) handlePlayerReady(media)
            }}
          />
        )
      case 'custom':
        return (
          <CustomVideoPlayer
            src={src}
            poster={poster}
            videoId={video.id}
            onTimeUpdate={handleTimeUpdate}
            onPlayerReady={handlePlayerReady}
          />
        )
      case 'mediachrome':
        return (
          <MediaChromePlayer
            src={src}
            poster={poster}
            videoId={video.id}
            onTimeUpdate={handleTimeUpdate}
            onPlayerReady={handlePlayerReady}
          />
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!videoId || !video) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Video Player Comparison</h1>
          <p className="text-gray-400 mb-8">Select a video to test different player styles</p>

          {videos.length === 0 ? (
            <div className="text-center py-12 bg-gray-900 rounded-xl">
              <p className="text-gray-400 mb-4">No videos found</p>
              <Link href="/upload" className="text-blue-400 hover:underline">
                Upload a video first
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {videos.map((v) => (
                <Link
                  key={v.id}
                  href={`/player-demo?v=${v.id}`}
                  className="bg-gray-900 rounded-xl overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all group"
                >
                  <div className="aspect-video bg-gray-800 relative">
                    {v.thumbnailUrl ? (
                      <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-sm font-medium">Test Players</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-white text-sm font-medium truncate">{v.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-lg font-semibold">Player Comparison Demo</h1>
            </div>
            <Link
              href={`/watch/${video.id}`}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Watch normally
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Main content */}
          <div className="flex-1">
            {/* Player selector tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              {playerOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setActivePlayer(option.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activePlayer === option.id
                      ? `bg-${option.color}-600 text-white shadow-lg shadow-${option.color}-500/20`
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {option.name}
                </button>
              ))}
            </div>

            {/* Player description */}
            <div className="mb-4 px-4 py-2 bg-gray-800/50 rounded-lg">
              <p className="text-gray-400 text-sm">
                {playerOptions.find((p) => p.id === activePlayer)?.description}
              </p>
            </div>

            {/* Video player */}
            <div className="bg-black rounded-xl overflow-hidden mb-4">
              {renderPlayer()}
            </div>

            {/* Video info */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">{video.title}</h2>
                <p className="text-gray-400 text-sm">Testing with video ID: {video.id}</p>
              </div>

              <button
                onClick={() => setShowClipCreator(!showClipCreator)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showClipCreator
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {showClipCreator ? 'Hide Clipper' : 'Try Inline Clipper'}
              </button>
            </div>

            {/* Feature comparison */}
            <div className="mt-8 bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Player Feature Comparison</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Feature</th>
                      <th className="text-center py-3 px-4 text-gray-400 font-medium">Original</th>
                      <th className="text-center py-3 px-4 text-gray-400 font-medium">Modern</th>
                      <th className="text-center py-3 px-4 text-gray-400 font-medium">Plyr</th>
                      <th className="text-center py-3 px-4 text-gray-400 font-medium">Custom</th>
                      <th className="text-center py-3 px-4 text-gray-400 font-medium">MediaChrome</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-300">
                    {[
                      ['Keyboard Shortcuts', true, true, true, true, true],
                      ['Playback Speed', true, true, true, true, true],
                      ['Fullscreen', true, true, true, true, true],
                      ['Picture-in-Picture', false, false, true, false, true],
                      ['Glassmorphism UI', false, true, false, false, false],
                      ['Double-tap Seek', false, false, false, true, false],
                      ['Volume Slider', true, true, true, true, true],
                      ['Time Tooltip', true, true, true, true, true],
                      ['Skip Buttons', false, true, true, false, true],
                      ['Modern Design', false, true, true, true, true],
                    ].map(([feature, ...support], i) => (
                      <tr key={i} className="border-b border-gray-800/50">
                        <td className="py-3 px-4">{feature}</td>
                        {support.map((s, j) => (
                          <td key={j} className="text-center py-3 px-4">
                            {s ? (
                              <span className="text-green-400">✓</span>
                            ) : (
                              <span className="text-gray-600">-</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Inline clip creator panel */}
          {showClipCreator && (
            <div className="flex-shrink-0">
              <InlineClipCreator
                videoId={video.id}
                videoElement={videoElement}
                duration={duration}
                currentTime={currentTime}
                onClose={() => setShowClipCreator(false)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PlayerDemoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin" />
      </div>
    }>
      <PlayerDemoContent />
    </Suspense>
  )
}
