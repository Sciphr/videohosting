'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import Player from 'video.js/dist/types/player'

interface VideoPlayerProps {
  src: string
  poster?: string
  videoId: string
  onTimeUpdate?: (currentTime: number) => void
  onEnded?: () => void
  onPlayerReady?: (player: Player) => void
}

export default function VideoPlayer({ src, poster, videoId, onTimeUpdate, onEnded, onPlayerReady }: VideoPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<Player | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current && videoRef.current) {
      const videoElement = document.createElement('video-js')
      videoElement.classList.add('vjs-big-play-centered')
      videoRef.current.appendChild(videoElement)

      const player = videojs(videoElement, {
        autoplay: false,
        controls: true,
        responsive: true,
        fluid: true,
        preload: 'auto',
        poster: poster || undefined,
        playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
        controlBar: {
          volumePanel: {
            inline: false,
            vertical: true,
          },
          children: [
            'playToggle',
            'volumePanel',
            'currentTimeDisplay',
            'timeDivider',
            'durationDisplay',
            'progressControl',
            'playbackRateMenuButton',
            'fullscreenToggle'
          ]
        },
        sources: [{
          src: src,
          type: 'video/mp4'
        }]
      }, function() {
        console.log('Player is ready')

        // Handle timestamp from URL query parameter
        const timeParam = searchParams.get('t')
        if (timeParam) {
          const timestamp = parseFloat(timeParam)
          if (!isNaN(timestamp) && timestamp >= 0) {
            player.currentTime(timestamp)
          }
        }

        if (onPlayerReady) {
          onPlayerReady(this)
        }
      })

      // Time update event
      if (onTimeUpdate) {
        player.on('timeupdate', () => {
          onTimeUpdate(player.currentTime() || 0)
        })
      }

      // Ended event
      if (onEnded) {
        player.on('ended', onEnded)
      }

      // Track view after watching 30 seconds
      let viewTracked = false
      player.on('timeupdate', () => {
        if (!viewTracked && player.currentTime() && player.currentTime() > 30) {
          viewTracked = true
          fetch(`/api/videos/${videoId}/view`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ watchDuration: player.currentTime() }),
          }).catch(() => {})
        }
      })

      playerRef.current = player
    }

    // Cleanup
    return () => {
      const player = playerRef.current
      if (player && !player.isDisposed()) {
        player.dispose()
        playerRef.current = null
      }
    }
  }, [src, poster, videoId, onTimeUpdate, onEnded, searchParams])

  return (
    <div data-vjs-player>
      <div ref={videoRef} className="video-js-custom" />
    </div>
  )
}
