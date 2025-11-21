'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface InlineClipCreatorProps {
  videoId: string
  videoElement: HTMLVideoElement | null
  duration: number
  currentTime: number
  onClose: () => void
  onClipCreated?: () => void
}

/**
 * InlineClipCreator - YouTube-style inline clip creation panel
 * Features:
 * - Appears as a side panel without blocking the video
 * - Draggable timeline handles for start/end selection
 * - Real-time preview of clip range
 * - Simple time input fields
 * - Compact, non-intrusive design
 */
export default function InlineClipCreator({
  videoId,
  videoElement,
  duration,
  currentTime,
  onClose,
  onClipCreated
}: InlineClipCreatorProps) {
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(30)
  const [title, setTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null)

  const timelineRef = useRef<HTMLDivElement>(null)

  // Initialize with current playback position
  useEffect(() => {
    if (duration > 0) {
      const start = Math.max(0, currentTime - 5)
      const end = Math.min(duration, currentTime + 25)
      setStartTime(start)
      setEndTime(end)
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const parseTimeInput = (value: string): number => {
    const parts = value.split(':')
    if (parts.length === 2) {
      const mins = parseInt(parts[0]) || 0
      const secs = parseInt(parts[1]) || 0
      return mins * 60 + secs
    }
    return parseFloat(value) || 0
  }

  const formatTimeInput = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Handle timeline dragging
  const handleTimelineMouseDown = (e: React.MouseEvent, handle: 'start' | 'end') => {
    e.preventDefault()
    setIsDragging(handle)
  }

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current || isDragging) return

    const rect = timelineRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percent = clickX / rect.width
    const clickedTime = percent * duration

    // Determine which handle is closer
    const distToStart = Math.abs(clickedTime - startTime)
    const distToEnd = Math.abs(clickedTime - endTime)

    if (distToStart < distToEnd) {
      setStartTime(Math.max(0, Math.min(clickedTime, endTime - 2)))
    } else {
      setEndTime(Math.min(duration, Math.max(clickedTime, startTime + 2)))
    }
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !timelineRef.current) return

    const rect = timelineRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const percent = Math.max(0, Math.min(1, mouseX / rect.width))
    const newTime = percent * duration

    if (isDragging === 'start') {
      setStartTime(Math.max(0, Math.min(newTime, endTime - 2)))
    } else {
      setEndTime(Math.min(duration, Math.max(newTime, startTime + 2)))
    }
  }, [isDragging, duration, startTime, endTime])

  const handleMouseUp = useCallback(() => {
    setIsDragging(null)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Seek video to start time when changed
  const seekToStart = () => {
    if (videoElement) {
      videoElement.currentTime = startTime
    }
  }

  const seekToEnd = () => {
    if (videoElement) {
      videoElement.currentTime = endTime
    }
  }

  // Use current video time for start/end
  const setStartToCurrent = () => {
    if (videoElement && videoElement.currentTime < endTime - 2) {
      setStartTime(videoElement.currentTime)
    }
  }

  const setEndToCurrent = () => {
    if (videoElement && videoElement.currentTime > startTime + 2) {
      setEndTime(videoElement.currentTime)
    }
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Please enter a title')
      return
    }

    const clipDuration = endTime - startTime
    if (clipDuration < 2) {
      setError('Clip must be at least 2 seconds')
      return
    }
    if (clipDuration > 120) {
      setError('Clip cannot exceed 2 minutes')
      return
    }

    setCreating(true)
    setError('')

    try {
      const res = await fetch(`/api/videos/${videoId}/clips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          startTime,
          endTime,
        }),
      })

      if (!res.ok) throw new Error('Failed to create clip')

      const clip = await res.json()
      onClipCreated?.()
      window.location.href = `/watch/${clip.id}`
    } catch (err) {
      setError('Failed to create clip')
      setCreating(false)
    }
  }

  const clipDuration = endTime - startTime

  return (
    <div className="w-80 bg-gray-900/95 backdrop-blur-xl rounded-xl border border-gray-700/50 shadow-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-white font-semibold">Create Clip</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-700/50 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        {/* Title input */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Clip Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter clip title..."
            className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
            maxLength={100}
          />
        </div>

        {/* Time range inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Start</label>
            <div className="relative">
              <input
                type="text"
                value={formatTimeInput(startTime)}
                onChange={(e) => {
                  const newTime = parseTimeInput(e.target.value)
                  if (newTime < endTime - 2) setStartTime(newTime)
                }}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={setStartToCurrent}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                title="Use current time"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">End</label>
            <div className="relative">
              <input
                type="text"
                value={formatTimeInput(endTime)}
                onChange={(e) => {
                  const newTime = parseTimeInput(e.target.value)
                  if (newTime > startTime + 2 && newTime <= duration) setEndTime(newTime)
                }}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={setEndToCurrent}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                title="Use current time"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Visual timeline */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-400">Clip Range</label>
            <span className="text-xs text-blue-400 font-medium">{formatTime(clipDuration)} duration</span>
          </div>

          {/* Timeline bar */}
          <div
            ref={timelineRef}
            className="relative h-10 bg-gray-800 rounded-lg cursor-pointer select-none"
            onClick={handleTimelineClick}
          >
            {/* Full duration background */}
            <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-2 bg-gray-700 rounded-full" />

            {/* Selected range */}
            <div
              className="absolute top-1/2 -translate-y-1/2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"
              style={{
                left: `calc(8px + ${(startTime / duration) * (100 - 16 / timelineRef.current?.clientWidth! * 100 || 0)}%)`,
                right: `calc(8px + ${((duration - endTime) / duration) * (100 - 16 / timelineRef.current?.clientWidth! * 100 || 0)}%)`,
              }}
            />

            {/* Start handle */}
            <div
              className={`absolute top-1/2 -translate-y-1/2 w-4 h-8 bg-blue-500 rounded cursor-ew-resize flex items-center justify-center hover:bg-blue-400 transition-colors ${isDragging === 'start' ? 'ring-2 ring-blue-300' : ''}`}
              style={{
                left: `calc(${(startTime / duration) * 100}% - 2px)`,
              }}
              onMouseDown={(e) => handleTimelineMouseDown(e, 'start')}
            >
              <div className="w-0.5 h-4 bg-white/50 rounded" />
            </div>

            {/* End handle */}
            <div
              className={`absolute top-1/2 -translate-y-1/2 w-4 h-8 bg-blue-500 rounded cursor-ew-resize flex items-center justify-center hover:bg-blue-400 transition-colors ${isDragging === 'end' ? 'ring-2 ring-blue-300' : ''}`}
              style={{
                left: `calc(${(endTime / duration) * 100}% - 14px)`,
              }}
              onMouseDown={(e) => handleTimelineMouseDown(e, 'end')}
            >
              <div className="w-0.5 h-4 bg-white/50 rounded" />
            </div>

            {/* Time labels */}
            <div className="absolute -bottom-5 left-0 text-[10px] text-gray-500">0:00</div>
            <div className="absolute -bottom-5 right-0 text-[10px] text-gray-500">{formatTime(duration)}</div>
          </div>
        </div>

        {/* Preview buttons */}
        <div className="flex gap-2">
          <button
            onClick={seekToStart}
            className="flex-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs text-gray-300 transition-colors flex items-center justify-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
            </svg>
            Preview Start
          </button>
          <button
            onClick={seekToEnd}
            className="flex-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs text-gray-300 transition-colors flex items-center justify-center gap-1"
          >
            Preview End
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
            </svg>
          </button>
        </div>

        {/* Info/constraints */}
        <div className="text-xs text-gray-500 bg-gray-800/50 rounded-lg px-3 py-2">
          Clips must be 2 seconds to 2 minutes long
        </div>

        {/* Error message */}
        {error && (
          <div className="text-xs text-red-400 bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
      </div>

      {/* Footer with create button */}
      <div className="p-4 border-t border-gray-700/50 bg-gray-800/30">
        <button
          onClick={handleSubmit}
          disabled={creating || !title.trim()}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          {creating ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creating...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Create Clip
            </>
          )}
        </button>
      </div>
    </div>
  )
}
