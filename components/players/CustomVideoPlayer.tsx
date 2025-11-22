'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'

interface CustomVideoPlayerProps {
  src: string
  poster?: string
  videoId: string
  onTimeUpdate?: (currentTime: number) => void
  onEnded?: () => void
  onPlayerReady?: (videoElement: HTMLVideoElement) => void
}

/**
 * CustomVideoPlayer - Fully custom HTML5 video player
 * Features:
 * - Minimal, cinema-style design
 * - Floating controls that appear on hover
 * - Animated progress bar
 * - Touch-friendly large controls
 * - Double-tap to seek (mobile)
 * - Chapter markers support
 */
export default function CustomVideoPlayer({
  src,
  poster,
  videoId,
  onTimeUpdate,
  onEnded,
  onPlayerReady
}: CustomVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressContainerRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [buffered, setBuffered] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [hoverTime, setHoverTime] = useState<number | null>(null)
  const [hoverPosition, setHoverPosition] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [showDoubleTap, setShowDoubleTap] = useState<'left' | 'right' | null>(null)

  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null)
  const viewTracked = useRef(false)
  const lastTapTime = useRef(0)
  const lastTapSide = useRef<'left' | 'right' | null>(null)

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00'
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }, [isPlaying])

  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      setVolume(newVolume)
      setIsMuted(newVolume === 0)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressContainerRef.current && videoRef.current) {
      const rect = progressContainerRef.current.getBoundingClientRect()
      const pos = (e.clientX - rect.left) / rect.width
      videoRef.current.currentTime = pos * duration
    }
  }

  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressContainerRef.current) {
      const rect = progressContainerRef.current.getBoundingClientRect()
      const pos = (e.clientX - rect.left) / rect.width
      setHoverTime(pos * duration)
      setHoverPosition(e.clientX - rect.left)
    }
  }

  const toggleFullscreen = async () => {
    if (!containerRef.current) return

    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      await document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const changePlaybackRate = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate
      setPlaybackRate(rate)
      setShowSpeedMenu(false)
    }
  }

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds
    }
  }

  // Handle double-tap to seek (mobile)
  const handleVideoClick = (e: React.MouseEvent) => {
    const currentTapTime = Date.now()
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const tapX = e.clientX - rect.left
    const side = tapX < rect.width / 2 ? 'left' : 'right'

    if (currentTapTime - lastTapTime.current < 300 && lastTapSide.current === side) {
      // Double tap
      if (side === 'left') {
        skip(-10)
        setShowDoubleTap('left')
      } else {
        skip(10)
        setShowDoubleTap('right')
      }
      setTimeout(() => setShowDoubleTap(null), 500)
      lastTapTime.current = 0
      lastTapSide.current = null
    } else {
      lastTapTime.current = currentTapTime
      lastTapSide.current = side
      // Single tap after delay
      setTimeout(() => {
        if (Date.now() - lastTapTime.current >= 280) {
          togglePlay()
        }
      }, 300)
    }
  }

  const handleMouseMove = () => {
    setShowControls(true)
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current)
    }
    if (isPlaying) {
      hideControlsTimeout.current = setTimeout(() => {
        setShowControls(false)
      }, 2500)
    }
  }

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      onTimeUpdate?.(video.currentTime)

      if (!viewTracked.current && video.currentTime > 30) {
        viewTracked.current = true
        fetch(`/api/videos/${videoId}/view`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ watchDuration: video.currentTime }),
        }).catch(() => {})
      }
    }
    const handleDurationChange = () => setDuration(video.duration)
    const handleProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1))
      }
    }
    const handleEnded = () => {
      setIsPlaying(false)
      onEnded?.()
    }
    const handleLoadedMetadata = () => {
      setDuration(video.duration)
      setIsLoading(false)
      const timeParam = searchParams.get('t')
      if (timeParam) {
        const timestamp = parseFloat(timeParam)
        if (!isNaN(timestamp) && timestamp >= 0) {
          video.currentTime = timestamp
        }
      }
      onPlayerReady?.(video)
    }
    const handleWaiting = () => setIsLoading(true)
    const handleCanPlay = () => setIsLoading(false)

    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('durationchange', handleDurationChange)
    video.addEventListener('progress', handleProgress)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('waiting', handleWaiting)
    video.addEventListener('canplay', handleCanPlay)

    return () => {
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('durationchange', handleDurationChange)
      video.removeEventListener('progress', handleProgress)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('waiting', handleWaiting)
      video.removeEventListener('canplay', handleCanPlay)
    }
  }, [videoId, onTimeUpdate, onEnded, onPlayerReady, searchParams])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault()
          togglePlay()
          break
        case 'f':
          e.preventDefault()
          toggleFullscreen()
          break
        case 'm':
          e.preventDefault()
          toggleMute()
          break
        case 'arrowleft':
        case 'j':
          e.preventDefault()
          skip(-10)
          break
        case 'arrowright':
        case 'l':
          e.preventDefault()
          skip(10)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlay])

  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2]

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-xl overflow-hidden cursor-none select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        isPlaying && setShowControls(false)
        setHoverTime(null)
      }}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        onClick={handleVideoClick}
        playsInline
      />

      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-white/20 border-t-violet-500 rounded-full animate-spin" />
        </div>
      )}

      {/* Double-tap indicator */}
      {showDoubleTap && (
        <div
          className={`absolute top-1/2 -translate-y-1/2 ${
            showDoubleTap === 'left' ? 'left-[15%]' : 'right-[15%]'
          } bg-white/20 backdrop-blur-sm rounded-full p-6 animate-ping`}
        >
          <span className="text-white font-bold text-lg">
            {showDoubleTap === 'left' ? '-10s' : '+10s'}
          </span>
        </div>
      )}

      {/* Center play button */}
      {!isPlaying && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-24 h-24 rounded-full bg-violet-600/80 backdrop-blur-md flex items-center justify-center shadow-[0_0_40px_rgba(139,92,246,0.4)] animate-pulse">
            <svg className="w-12 h-12 text-white ml-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Controls overlay */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ cursor: showControls ? 'default' : 'none' }}
      >
        {/* Top gradient */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/60 to-transparent" />

        {/* Bottom controls area */}
        <div className="absolute bottom-0 left-0 right-0">
          {/* Progress bar */}
          <div className="px-4 mb-2">
            <div
              ref={progressContainerRef}
              className="relative h-1.5 bg-white/20 rounded-full cursor-pointer group hover:h-3 transition-all duration-200"
              onClick={handleSeek}
              onMouseMove={handleProgressHover}
              onMouseLeave={() => setHoverTime(null)}
            >
              {/* Buffered */}
              <div
                className="absolute h-full bg-white/30 rounded-full"
                style={{ width: `${(buffered / duration) * 100}%` }}
              />
              {/* Progress */}
              <div
                className="absolute h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Hover preview */}
              {hoverTime !== null && (
                <div
                  className="absolute -top-10 bg-gray-900/95 px-3 py-1.5 rounded-lg text-white text-sm font-medium shadow-xl transform -translate-x-1/2 pointer-events-none"
                  style={{ left: hoverPosition }}
                >
                  {formatTime(hoverTime)}
                </div>
              )}
            </div>
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center gap-3">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-white/10 transition-all hover:scale-105"
              >
                {isPlaying ? (
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Volume */}
              <div className="flex items-center gap-2 group">
                <button
                  onClick={toggleMute}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                >
                  {isMuted || volume === 0 ? (
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                  )}
                </button>
                <div className="w-0 overflow-hidden group-hover:w-20 transition-all duration-300">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer accent-violet-500"
                  />
                </div>
              </div>

              {/* Time */}
              <span className="text-white/90 text-sm font-medium tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Playback speed */}
              <div className="relative">
                <button
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  className="h-9 px-3 flex items-center gap-1 rounded-full hover:bg-white/10 transition-colors text-white text-sm font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {playbackRate}x
                </button>

                {showSpeedMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-gray-900/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden min-w-[120px]">
                    {playbackRates.map((rate) => (
                      <button
                        key={rate}
                        onClick={() => changePlaybackRate(rate)}
                        className={`w-full px-4 py-2.5 text-sm text-left transition-colors ${
                          playbackRate === rate
                            ? 'text-violet-400 bg-violet-500/10'
                            : 'text-white hover:bg-white/10'
                        }`}
                      >
                        {rate}x {rate === 1 && <span className="text-white/50 ml-2">Normal</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              >
                {isFullscreen ? (
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
