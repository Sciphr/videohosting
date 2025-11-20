'use client'

import { useState, useEffect } from 'react'
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handlePreview = () => {
    if (player) {
      player.currentTime(startTime)
      player.play()
      
      // Auto-pause at end time
      const checkTime = () => {
        if (player.currentTime() >= endTime) {
          player.pause()
          player.off('timeupdate', checkTime)
        }
      }
      player.on('timeupdate', checkTime)
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

    if (endTime - startTime < 5) {
      setError('Clip must be at least 5 seconds long')
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
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Clip Range
              </label>
              
              <div className="space-y-4">
                {/* Start Time Slider */}
                <div>
                  <div className="flex justify-between text-sm text-gray-400 mb-1">
                    <span>Start Time</span>
                    <span>{formatTime(startTime)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={duration}
                    step="0.1"
                    value={startTime}
                    onChange={(e) => setStartTime(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                  />
                </div>

                {/* End Time Slider */}
                <div>
                  <div className="flex justify-between text-sm text-gray-400 mb-1">
                    <span>End Time</span>
                    <span>{formatTime(endTime)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={duration}
                    step="0.1"
                    value={endTime}
                    onChange={(e) => setEndTime(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                  />
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">
                    Clip Duration: <span className="text-white font-medium">{formatTime(clipDuration)}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handlePreview}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium"
                  >
                    Preview
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
                <strong>Note:</strong> Clips must be between 5 seconds and 2 minutes long. 
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
