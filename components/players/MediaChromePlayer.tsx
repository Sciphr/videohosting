'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import 'media-chrome'

interface MediaChromePlayerProps {
  src: string
  poster?: string
  videoId: string
  onTimeUpdate?: (currentTime: number) => void
  onEnded?: () => void
  onPlayerReady?: (videoElement: HTMLVideoElement) => void
}

/**
 * MediaChromePlayer - Using media-chrome web components
 * Features:
 * - Web components based (framework agnostic)
 * - Highly customizable via CSS
 * - Built-in accessibility
 * - Modern, clean design
 * - Responsive controls
 */
export default function MediaChromePlayer({
  src,
  poster,
  videoId,
  onTimeUpdate,
  onEnded,
  onPlayerReady
}: MediaChromePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const searchParams = useSearchParams()
  const viewTracked = useRef(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
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

    const handleEnded = () => onEnded?.()

    const handleLoadedMetadata = () => {
      const timeParam = searchParams.get('t')
      if (timeParam) {
        const timestamp = parseFloat(timeParam)
        if (!isNaN(timestamp) && timestamp >= 0) {
          video.currentTime = timestamp
        }
      }
      onPlayerReady?.(video)
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [videoId, onTimeUpdate, onEnded, onPlayerReady, searchParams])

  if (!mounted) {
    return (
      <div className="w-full aspect-video bg-black rounded-xl flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="media-chrome-container">
      {/* @ts-ignore - media-chrome web components */}
      <media-controller class="w-full aspect-video rounded-xl overflow-hidden">
        <video
          ref={videoRef}
          slot="media"
          src={src}
          poster={poster}
          playsInline
          className="w-full h-full object-contain"
        />

        {/* @ts-ignore */}
        <media-poster-image slot="poster" src={poster}></media-poster-image>

        {/* @ts-ignore */}
        <media-loading-indicator slot="centered-chrome" noautohide></media-loading-indicator>

        {/* @ts-ignore */}
        <media-play-button slot="centered-chrome"></media-play-button>

        {/* @ts-ignore */}
        <media-control-bar>
          {/* @ts-ignore */}
          <media-play-button></media-play-button>
          {/* @ts-ignore */}
          <media-seek-backward-button seek-offset="10"></media-seek-backward-button>
          {/* @ts-ignore */}
          <media-seek-forward-button seek-offset="10"></media-seek-forward-button>
          {/* @ts-ignore */}
          <media-mute-button></media-mute-button>
          {/* @ts-ignore */}
          <media-volume-range></media-volume-range>
          {/* @ts-ignore */}
          <media-time-display showduration></media-time-display>
          {/* @ts-ignore */}
          <media-time-range></media-time-range>
          {/* @ts-ignore */}
          <media-playback-rate-button rates="0.5 0.75 1 1.25 1.5 2"></media-playback-rate-button>
          {/* @ts-ignore */}
          <media-pip-button></media-pip-button>
          {/* @ts-ignore */}
          <media-fullscreen-button></media-fullscreen-button>
        </media-control-bar>
      </media-controller>

      <style jsx global>{`
        .media-chrome-container {
          --media-primary-color: #10b981;
          --media-secondary-color: #fff;
          --media-control-background: transparent;
          --media-control-hover-background: rgba(255, 255, 255, 0.1);
          --media-range-track-background: rgba(255, 255, 255, 0.2);
          --media-range-track-border-radius: 4px;
          --media-range-track-height: 4px;
          --media-range-thumb-background: #10b981;
          --media-range-thumb-width: 14px;
          --media-range-thumb-height: 14px;
          --media-range-thumb-border-radius: 50%;
          --media-time-range-buffered-color: rgba(255, 255, 255, 0.3);
          --media-font-family: inherit;
          --media-font-size: 14px;
          --media-button-icon-width: 24px;
          --media-button-icon-height: 24px;
        }

        .media-chrome-container media-controller {
          --media-control-background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
          background: #000;
        }

        .media-chrome-container media-controller:not([mediapaused]) media-play-button[slot="centered-chrome"] {
          opacity: 0;
          transition: opacity 0.3s;
        }

        .media-chrome-container media-play-button[slot="centered-chrome"] {
          --media-button-icon-width: 48px;
          --media-button-icon-height: 48px;
          background: rgba(16, 185, 129, 0.9);
          border-radius: 50%;
          padding: 20px;
          backdrop-filter: blur(8px);
          transition: all 0.3s ease;
        }

        .media-chrome-container media-play-button[slot="centered-chrome"]:hover {
          background: rgba(16, 185, 129, 1);
          transform: scale(1.1);
          box-shadow: 0 0 40px rgba(16, 185, 129, 0.4);
        }

        .media-chrome-container media-control-bar {
          background: linear-gradient(transparent, rgba(0, 0, 0, 0.85));
          padding: 40px 12px 12px;
          gap: 4px;
        }

        .media-chrome-container media-control-bar > * {
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .media-chrome-container media-control-bar > *:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .media-chrome-container media-time-range {
          flex: 1;
          height: 36px;
          --media-range-track-height: 4px;
        }

        .media-chrome-container media-time-range:hover {
          --media-range-track-height: 6px;
        }

        .media-chrome-container media-volume-range {
          width: 80px;
        }

        .media-chrome-container media-time-display {
          color: rgba(255, 255, 255, 0.9);
          font-variant-numeric: tabular-nums;
        }

        .media-chrome-container media-playback-rate-button {
          min-width: 50px;
          color: rgba(255, 255, 255, 0.9);
        }

        .media-chrome-container media-loading-indicator {
          --media-loading-indicator-icon-width: 48px;
          --media-loading-indicator-icon-height: 48px;
        }

        @media (max-width: 768px) {
          .media-chrome-container media-control-bar {
            padding: 30px 8px 8px;
          }

          .media-chrome-container media-volume-range {
            display: none;
          }

          .media-chrome-container media-play-button[slot="centered-chrome"] {
            --media-button-icon-width: 36px;
            --media-button-icon-height: 36px;
            padding: 16px;
          }
        }
      `}</style>
    </div>
  )
}
