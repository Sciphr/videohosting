'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import Player from 'video.js/dist/types/player'

interface Chapter {
  id: string
  title: string
  timestamp: number
}

interface VideoPlayerProps {
  src: string
  poster?: string
  videoId: string
  chapters?: Chapter[]
  onTimeUpdate?: (currentTime: number) => void
  onEnded?: () => void
  onPlayerReady?: (player: Player) => void
  onChapterChange?: (chapter: Chapter | null) => void
}

export default function VideoPlayer({ src, poster, videoId, chapters = [], onTimeUpdate, onEnded, onPlayerReady, onChapterChange }: VideoPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<Player | null>(null)
  const markersRef = useRef<HTMLDivElement | null>(null)
  const searchParams = useSearchParams()
  const lastChapterRef = useRef<Chapter | null>(null)

  // Function to add chapter markers to the progress bar
  const addChapterMarkers = useCallback((player: Player, chapters: Chapter[]) => {
    const duration = player.duration()
    if (!duration || chapters.length === 0) return

    // Remove existing markers
    if (markersRef.current) {
      markersRef.current.remove()
      markersRef.current = null
    }

    // Find the progress control element
    const progressControl = player.el().querySelector('.vjs-progress-control')
    if (!progressControl) return

    // Create markers container
    const markersContainer = document.createElement('div')
    markersContainer.className = 'vjs-chapter-markers'
    markersContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 1;
    `

    // Add marker for each chapter
    chapters.forEach((chapter, index) => {
      if (chapter.timestamp <= 0) return // Skip 0:00 chapter marker

      const percent = (chapter.timestamp / duration) * 100
      const marker = document.createElement('div')
      marker.className = 'vjs-chapter-marker'
      marker.style.cssText = `
        position: absolute;
        left: ${percent}%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 3px;
        height: 12px;
        background: rgba(139, 92, 246, 0.8);
        border-radius: 1px;
        pointer-events: auto;
        cursor: pointer;
        transition: all 0.15s ease;
      `

      // Tooltip
      const tooltip = document.createElement('div')
      tooltip.className = 'vjs-chapter-tooltip'
      tooltip.textContent = chapter.title
      tooltip.style.cssText = `
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        padding: 4px 8px;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        font-size: 12px;
        border-radius: 4px;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.15s ease;
        margin-bottom: 8px;
      `
      marker.appendChild(tooltip)

      marker.addEventListener('mouseenter', () => {
        marker.style.background = 'rgba(139, 92, 246, 1)'
        marker.style.transform = 'translate(-50%, -50%) scaleY(1.3)'
        tooltip.style.opacity = '1'
      })

      marker.addEventListener('mouseleave', () => {
        marker.style.background = 'rgba(139, 92, 246, 0.8)'
        marker.style.transform = 'translate(-50%, -50%)'
        tooltip.style.opacity = '0'
      })

      marker.addEventListener('click', (e) => {
        e.stopPropagation()
        player.currentTime(chapter.timestamp)
      })

      markersContainer.appendChild(marker)
    })

    const seekBar = progressControl.querySelector('.vjs-progress-holder')
    if (seekBar) {
      seekBar.appendChild(markersContainer)
      markersRef.current = markersContainer
    }
  }, [])

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

        // Add chapter markers once duration is available
        player.on('loadedmetadata', () => {
          if (chapters.length > 0) {
            addChapterMarkers(player, chapters)
          }
        })

        // Also try to add markers if duration is already available
        if (player.duration() && chapters.length > 0) {
          addChapterMarkers(player, chapters)
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

      // Chapter change tracking
      if (onChapterChange && chapters.length > 0) {
        player.on('timeupdate', () => {
          const currentTime = player.currentTime() || 0
          // Find current chapter (last chapter with timestamp <= currentTime)
          let currentChapter: Chapter | null = null
          for (let i = chapters.length - 1; i >= 0; i--) {
            if (chapters[i].timestamp <= currentTime) {
              currentChapter = chapters[i]
              break
            }
          }
          // Only notify if chapter changed
          if (currentChapter?.id !== lastChapterRef.current?.id) {
            lastChapterRef.current = currentChapter
            onChapterChange(currentChapter)
          }
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
      if (markersRef.current) {
        markersRef.current.remove()
        markersRef.current = null
      }
    }
  }, [src, poster, videoId, onTimeUpdate, onEnded, searchParams, onPlayerReady])

  // Update chapter markers when chapters change
  useEffect(() => {
    if (playerRef.current && chapters.length > 0) {
      const player = playerRef.current
      if (player.duration()) {
        addChapterMarkers(player, chapters)
      }
    }
  }, [chapters, addChapterMarkers])

  return (
    <div data-vjs-player>
      <div ref={videoRef} className="video-js-custom" />
    </div>
  )
}
