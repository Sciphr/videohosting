'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Plyr from 'plyr'
import 'plyr/dist/plyr.css'

interface PlyrVideoPlayerProps {
  src: string
  poster?: string
  videoId: string
  onTimeUpdate?: (currentTime: number) => void
  onEnded?: () => void
  onPlayerReady?: (player: Plyr) => void
}

/**
 * PlyrVideoPlayer - Using Plyr.js for a beautiful, accessible player
 * Features:
 * - Clean, minimal design
 * - Excellent accessibility
 * - Customizable colors via CSS
 * - Built-in quality selection
 * - Keyboard shortcuts
 * - Touch-friendly
 */
export default function PlyrVideoPlayer({
  src,
  poster,
  videoId,
  onTimeUpdate,
  onEnded,
  onPlayerReady
}: PlyrVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const playerRef = useRef<Plyr | null>(null)
  const searchParams = useSearchParams()
  const viewTracked = useRef(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!videoRef.current || playerRef.current) return

    // Initialize Plyr with custom options
    const player = new Plyr(videoRef.current, {
      controls: [
        'play-large',
        'play',
        'rewind',
        'fast-forward',
        'progress',
        'current-time',
        'duration',
        'mute',
        'volume',
        'captions',
        'settings',
        'pip',
        'airplay',
        'fullscreen'
      ],
      settings: ['captions', 'quality', 'speed', 'loop'],
      speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] },
      keyboard: { focused: true, global: true },
      tooltips: { controls: true, seek: true },
      seekTime: 10,
      invertTime: false,
      toggleInvert: false,
      displayDuration: true,
      hideControls: true,
      resetOnEnd: false,
      loadSprite: false,
      iconUrl: '',
      blankVideo: '',
    })

    playerRef.current = player

    // Event listeners
    player.on('ready', () => {
      setIsReady(true)
      // Handle timestamp from URL
      const timeParam = searchParams.get('t')
      if (timeParam) {
        const timestamp = parseFloat(timeParam)
        if (!isNaN(timestamp) && timestamp >= 0) {
          player.currentTime = timestamp
        }
      }
      onPlayerReady?.(player)
    })

    player.on('timeupdate', () => {
      const currentTime = player.currentTime
      onTimeUpdate?.(currentTime)

      // Track view after 30 seconds
      if (!viewTracked.current && currentTime > 30) {
        viewTracked.current = true
        fetch(`/api/videos/${videoId}/view`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ watchDuration: currentTime }),
        }).catch(() => {})
      }
    })

    player.on('ended', () => {
      onEnded?.()
    })

    return () => {
      player.destroy()
      playerRef.current = null
    }
  }, [videoId, onTimeUpdate, onEnded, onPlayerReady, searchParams])

  return (
    <div className="plyr-container-modern">
      <video
        ref={videoRef}
        poster={poster}
        playsInline
        className="plyr-video"
      >
        <source src={src} type="video/mp4" />
      </video>

      <style jsx global>{`
        .plyr-container-modern {
          --plyr-color-main: #06b6d4;
          --plyr-video-background: #000;
          --plyr-menu-background: rgba(15, 23, 42, 0.95);
          --plyr-menu-color: #fff;
          --plyr-menu-border-color: rgba(255, 255, 255, 0.1);
          --plyr-badge-background: #06b6d4;
          --plyr-badge-text-color: #fff;
          --plyr-badge-border-radius: 4px;
          --plyr-control-icon-size: 18px;
          --plyr-control-spacing: 10px;
          --plyr-font-family: inherit;
          --plyr-font-size-small: 13px;
          --plyr-font-size-time: 13px;
          --plyr-font-weight-regular: 500;
          --plyr-font-weight-bold: 600;
          --plyr-range-fill-background: #06b6d4;
          --plyr-range-thumb-background: #fff;
          --plyr-range-thumb-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
          --plyr-range-track-height: 4px;
          --plyr-tooltip-background: rgba(15, 23, 42, 0.95);
          --plyr-tooltip-color: #fff;
          --plyr-tooltip-padding: 6px 10px;
          --plyr-tooltip-radius: 6px;
          --plyr-tooltip-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          border-radius: 12px;
          overflow: hidden;
        }

        .plyr-container-modern .plyr {
          border-radius: 12px;
        }

        .plyr-container-modern .plyr__control--overlaid {
          background: rgba(6, 182, 212, 0.9);
          padding: 24px;
          backdrop-filter: blur(8px);
          transition: all 0.3s ease;
        }

        .plyr-container-modern .plyr__control--overlaid:hover {
          background: rgba(6, 182, 212, 1);
          transform: scale(1.1);
        }

        .plyr-container-modern .plyr__control--overlaid svg {
          width: 28px;
          height: 28px;
        }

        .plyr-container-modern .plyr__controls {
          background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
          padding: 60px 12px 12px;
        }

        .plyr-container-modern .plyr__control {
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .plyr-container-modern .plyr__control:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .plyr-container-modern .plyr__progress__container {
          flex: 1;
        }

        .plyr-container-modern .plyr__progress input[type="range"] {
          height: 6px;
        }

        .plyr-container-modern .plyr__progress input[type="range"]::-webkit-slider-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid #fff;
          box-shadow: 0 0 10px rgba(6, 182, 212, 0.5);
        }

        .plyr-container-modern .plyr__menu__container {
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(12px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }

        .plyr-container-modern .plyr__menu__container .plyr__control {
          padding: 10px 16px;
        }

        .plyr-container-modern .plyr__menu__container .plyr__control:hover {
          background: rgba(6, 182, 212, 0.2);
        }

        .plyr-container-modern .plyr__time {
          font-variant-numeric: tabular-nums;
        }

        .plyr-container-modern .plyr__volume {
          max-width: 100px;
        }

        .plyr-container-modern .plyr--fullscreen-fallback {
          border-radius: 0;
        }

        @media (max-width: 768px) {
          .plyr-container-modern .plyr__control--overlaid {
            padding: 18px;
          }

          .plyr-container-modern .plyr__control--overlaid svg {
            width: 24px;
            height: 24px;
          }
        }
      `}</style>
    </div>
  )
}
