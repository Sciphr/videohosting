'use client'

import { useEffect, useRef } from 'react'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import type Player from 'video.js/dist/types/player'

interface VideoPlayerProps {
  src: string
  poster?: string
  autoplay?: boolean
  className?: string
}

export default function VideoPlayer({
  src,
  poster,
  autoplay = false,
  className = ''
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<Player | null>(null)

  useEffect(() => {
    if (!videoRef.current) return

    const videoElement = document.createElement('video-js')
    videoElement.classList.add('vjs-big-play-centered', 'vjs-theme-gaming')
    videoRef.current.appendChild(videoElement)

    const player = videojs(videoElement, {
      controls: true,
      autoplay,
      preload: 'auto',
      fluid: true,
      responsive: true,
      playbackRates: [0.5, 1, 1.5, 2],
      poster,
      sources: [{
        src,
        type: 'video/mp4'
      }]
    })

    playerRef.current = player

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose()
        playerRef.current = null
      }
    }
  }, [src, poster, autoplay])

  return (
    <div data-vjs-player className={className}>
      <div ref={videoRef} />
    </div>
  )
}
