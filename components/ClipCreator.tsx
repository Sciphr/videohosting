'use client'

import { useState, useEffect, useRef } from 'react'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import Player from 'video.js/dist/types/player'

interface ClipCreatorProps {
  videoId: string
  player: Player | null
  onClose: () => void
  onClipCreated?: () => void
}

export default function ClipCreator({ videoId, player, onClose, onClipCreated }: ClipCreatorProps) {
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [previewing, setPreviewing] = useState(false)
  const [currentPreviewTime, setCurrentPreviewTime] = useState(0)
  const previewPlayerRef = useRef<Player | null>(null)

  useEffect(() => {
    if (player) {
      const videoDuration = player.duration()
      setDuration(videoDuration)
      setEndTime(Math.min(30, videoDuration)) // Default to 30 seconds or video duration

      // Set start time to current playback position
      const currentTime = player.currentTime()
      setStartTime(currentTime)
      setEndTime(Math.min(currentTime + 30, videoDuration))
    }
  }, [player])


  useEffect(() => {
    if (!previewing || !previewPlayerRef.current) return

    const checkTime = setInterval(() => {
      const previewPlayer = previewPlayerRef.current
      if (!previewPlayer) return

      const currentPlaybackTime = previewPlayer.currentTime()
      setCurrentPreviewTime(currentPlaybackTime)

      // Auto-pause at end time
      if (currentPlaybackTime >= endTime) {
        previewPlayer.pause()
        setPreviewing(false)
        clearInterval(checkTime)
      }
    }, 100)

    return () => clearInterval(checkTime)
  }, [previewing, endTime])

  useEffect(() => {
    // Initialize preview player when modal opens
    if (!player) return

    // If player already initialized, don't reinitialize
    if (previewPlayerRef.current && !previewPlayerRef.current.isDisposed()) {
      console.log('Preview player already initialized')
      return
    }

    const previewVideoDiv = document.getElementById(`preview-player-${videoId}`)
    if (!previewVideoDiv) return

    // Clear any existing content
    previewVideoDiv.innerHTML = ''

    try {
      const videoElement = document.createElement('video')
      videoElement.className = 'video-js vjs-big-play-centered'
      previewVideoDiv.appendChild(videoElement)

      const previewPlayer = videojs(videoElement, {
        autoplay: false,
        controls: true,
        responsive: true,
        fluid: true,
        preload: 'metadata',
        playbackRates: [1],
        controlBar: {
          children: ['playToggle', 'progressControl', 'volumePanel', 'fullscreenToggle']
        },
      }, function() {
        console.log('Preview player ready')
        this.src({
          src: `/api/videos/${videoId}/stream`,
          type: 'video/mp4',
        })
      })

      previewPlayer.on('loadedmetadata', () => {
        console.log('Preview player metadata loaded, duration:', previewPlayer.duration())
      })

      previewPlayer.on('canplay', () => {
        console.log('Preview player can play')
      })

      previewPlayer.on('error', () => {
        const err = previewPlayer.error()
        console.error('Preview player error:', err?.code, err?.message)
      })

      previewPlayerRef.current = previewPlayer
      console.log('Preview player initialized and ref set')
    } catch (err) {
      console.error('Error initializing preview player:', err)
    }
  }, [videoId, player])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handlePreview = () => {
    console.log('Preview button clicked')
    console.log('Player ref:', previewPlayerRef.current)
    console.log('Player disposed:', previewPlayerRef.current?.isDisposed())

    if (previewPlayerRef.current && !previewPlayerRef.current.isDisposed()) {
      try {
        setPreviewing(true)
        setCurrentPreviewTime(startTime)
        console.log('Setting current time to:', startTime)
        previewPlayerRef.current.currentTime(startTime)
        console.log('Calling play')
        previewPlayerRef.current.play().catch((err: any) => {
          console.error('Play error:', err)
        })
      } catch (err) {
        console.error('Error in preview:', err)
      }
    } else {
      console.log('Preview player not ready')
    }
  }

  const handleStopPreview = () => {
    if (previewPlayerRef.current) {
      previewPlayerRef.current.pause()
      setPreviewing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      setError('Please enter a title for the clip')
      return
    }

    if (endTime <= startTime) {
      setError('End time must be after start time')
      return
    }

    if (endTime - startTime < 2) {
      setError('Clip must be at least 2 seconds long')
      return
    }

    if (endTime - startTime > 120) {
      setError('Clip cannot be longer than 2 minutes')
      return
    }

    setCreating(true)
    setError('')

    try {
      const res = await fetch(`/api/videos/${videoId}/clips`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          startTime,
          endTime,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to create clip')
      }

      const clip = await res.json()
      
      // Redirect to the new clip
      window.location.href = `/watch/${clip.id}`
      
      if (onClipCreated) {
        onClipCreated()
      }
    } catch (err) {
      setError('Failed to create clip. Please try again.')
      setCreating(false)
    }
  }

  const clipDuration = endTime - startTime

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Create Clip</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Time Range Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-4">
                Select Clip Range
              </label>

              {/* Preview Player */}
              <div className="mb-6 bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                <div id={`preview-player-${videoId}`} className="w-full h-full" data-vjs-player>
                  {/* Video.js player will be initialized here */}
                </div>
              </div>

              {/* Time Range Visualization */}
              <div className="mb-6">
                {/* Timeline Bar */}
                <div className="relative mb-4 h-2 bg-gray-600 rounded-full overflow-hidden">
                  {/* Total duration track */}
                  <div className="absolute inset-0 bg-gray-700"></div>

                  {/* Selected clip range highlight */}
                  <div
                    className="absolute h-full bg-blue-500 transition-all"
                    style={{
                      left: `${(startTime / duration) * 100}%`,
                      right: `${((duration - endTime) / duration) * 100}%`,
                    }}
                  ></div>

                  {/* Start marker */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-400 rounded-full border-2 border-blue-300 shadow-lg"
                    style={{
                      left: `calc(${(startTime / duration) * 100}% - 6px)`,
                    }}
                  ></div>

                  {/* End marker */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-400 rounded-full border-2 border-blue-300 shadow-lg"
                    style={{
                      left: `calc(${(endTime / duration) * 100}% - 6px)`,
                    }}
                  ></div>
                </div>

                {/* Time labels */}
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <p className="text-xs text-gray-400">Start Time</p>
                    <p className="text-blue-400 font-semibold">{formatTime(startTime)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Duration</p>
                    <p className="text-white font-semibold">{formatTime(clipDuration)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">End Time</p>
                    <p className="text-blue-400 font-semibold">{formatTime(endTime)}</p>
                  </div>
                </div>
              </div>

              {/* Sliders with Timeline Visualization */}
              <div className="space-y-4 bg-gray-700 rounded-lg p-4">
                {/* Interactive Timeline Slider */}
                <div>
                  <div className="flex justify-between text-sm text-gray-300 mb-3">
                    <label className="font-medium">Select Clip Range</label>
                  </div>

                  {/* Visual timeline with overlaid range sliders */}
                  <div
                    className="relative"
                    onMouseDown={(e) => {
                      const container = e.currentTarget
                      const rect = container.getBoundingClientRect()
                      const clickX = e.clientX - rect.left
                      const clickPercent = clickX / rect.width
                      const midpoint = (startTime + endTime) / (2 * duration)

                      // If clicked on left half, activate start slider; if on right half, activate end slider
                      if (clickPercent < midpoint) {
                        const startSlider = document.getElementById('start-slider') as HTMLInputElement
                        if (startSlider) startSlider.focus()
                      } else {
                        const endSlider = document.getElementById('end-slider') as HTMLInputElement
                        if (endSlider) endSlider.focus()
                      }
                    }}
                  >
                    {/* Background timeline bar */}
                    <div className="relative h-8 bg-gray-600 rounded-lg overflow-visible cursor-pointer">
                      {/* Total duration track */}
                      <div className="absolute inset-y-0 left-0 right-0 h-2 top-1/2 -translate-y-1/2 bg-gray-700 rounded-full"></div>

                      {/* Selected clip range highlight */}
                      <div
                        className="absolute h-2 top-1/2 -translate-y-1/2 bg-blue-500 rounded-full transition-all pointer-events-none"
                        style={{
                          left: `${(startTime / duration) * 100}%`,
                          right: `${((duration - endTime) / duration) * 100}%`,
                        }}
                      ></div>

                      {/* Start time slider */}
                      <input
                        id="start-slider"
                        type="range"
                        min="0"
                        max={duration}
                        step="0.1"
                        value={startTime}
                        onInput={(e) => {
                          const newStart = parseFloat(e.currentTarget.value)
                          if (newStart < endTime) {
                            setStartTime(newStart)
                          }
                        }}
                        className="absolute top-0 h-full opacity-0 cursor-pointer"
                        style={{
                          pointerEvents: 'auto',
                          zIndex: 5,
                          left: 0,
                          width: '100%',
                        }}
                      />

                      {/* End time slider */}
                      <input
                        id="end-slider"
                        type="range"
                        min="0"
                        max={duration}
                        step="0.1"
                        value={endTime}
                        onInput={(e) => {
                          const newEnd = parseFloat(e.currentTarget.value)
                          if (newEnd > startTime) {
                            setEndTime(newEnd)
                          }
                        }}
                        className="absolute top-0 h-full opacity-0 cursor-pointer"
                        style={{
                          pointerEvents: 'auto',
                          zIndex: 4,
                          left: 0,
                          width: '100%',
                        }}
                      />

                      {/* Start marker */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-blue-400 rounded-full border-2 border-blue-300 shadow-lg pointer-events-none"
                        style={{
                          left: `calc(${(startTime / duration) * 100}% - 10px)`,
                        }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs bg-gray-900 text-blue-300 px-2 py-1 rounded border border-blue-500/50 pointer-events-none">
                          {formatTime(startTime)}
                        </div>
                      </div>

                      {/* End marker */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-blue-400 rounded-full border-2 border-blue-300 shadow-lg pointer-events-none"
                        style={{
                          left: `calc(${(endTime / duration) * 100}% - 10px)`,
                        }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs bg-gray-900 text-blue-300 px-2 py-1 rounded border border-blue-500/50 pointer-events-none">
                          {formatTime(endTime)}
                        </div>
                      </div>
                    </div>

                    {/* Time scale below timeline */}
                    <div className="flex justify-between text-xs text-gray-400 mt-2 px-1">
                      <span>0:00</span>
                      <span>{formatTime(duration / 2)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>
                </div>

                {/* Duration and Preview */}
                <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-700">
                  <div>
                    <span className="text-gray-400">Duration: </span>
                    <span className="text-white font-medium">{formatTime(clipDuration)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={previewing ? handleStopPreview : handlePreview}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      previewing
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-gray-800 hover:bg-gray-700 text-white'
                    }`}
                  >
                    {previewing ? '⏸ Stop Preview' : '▶ Preview'}
                  </button>
                </div>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Clip Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your clip an awesome title"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                maxLength={100}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description..."
                rows={3}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                maxLength={500}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
              <p className="text-blue-200 text-sm">
                <strong>Note:</strong> Clips must be between 2 seconds and 2 minutes long.
                The clip will be linked to this video as the original source.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={creating}
              >
                {creating ? 'Creating Clip...' : 'Create Clip'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
