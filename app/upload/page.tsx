'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Game {
  id: string
  name: string
  _count?: {
    videos: number
  }
}

export default function UploadPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoType: 'CLIP' as 'CLIP' | 'FULL',
    gameId: '',
  })
  const [publishMode, setPublishMode] = useState<'now' | 'draft' | 'scheduled'>('now')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [games, setGames] = useState<Game[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')
  const [showNewGameForm, setShowNewGameForm] = useState(false)
  const [newGameName, setNewGameName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/upload')
    }
  }, [status, router])

  useEffect(() => {
    fetchGames()
  }, [])

  const fetchGames = async () => {
    try {
      const res = await fetch('/api/games')
      if (res.ok) {
        const data = await res.json()
        setGames(data)
      }
    } catch (error) {
      console.error('Failed to fetch games:', error)
    }
  }

  const handleCreateGame = async () => {
    if (!newGameName.trim()) return

    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newGameName.trim(),
        }),
      })

      if (res.ok) {
        const game = await res.json()
        setGames([...games, game])
        setFormData({ ...formData, gameId: game.id })
        setNewGameName('')
        setShowNewGameForm(false)
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to create game')
      }
    } catch (error) {
      alert('Failed to create game')
    }
  }

  const handleAddTag = () => {
    const trimmedTag = newTag.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a video file')
      return
    }

    if (!formData.title.trim()) {
      setError('Please enter a title')
      return
    }

    setIsUploading(true)
    setError('')
    setUploadProgress(0)

    try {
      // Check file size - Next.js has limits we need to respect
      const maxSize = 500 * 1024 * 1024 // 500MB limit for Next.js
      if (file.size > maxSize) {
        setError(`File is too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum size is 500MB.`)
        setIsUploading(false)
        return
      }

      // Validate scheduled date if scheduling
      if (publishMode === 'scheduled') {
        if (!scheduledDate || !scheduledTime) {
          setError('Please select a date and time for scheduled publishing')
          setIsUploading(false)
          return
        }
        const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`)
        if (scheduledDateTime <= new Date()) {
          setError('Scheduled time must be in the future')
          setIsUploading(false)
          return
        }
      }

      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('title', formData.title.trim())
      uploadFormData.append('description', formData.description.trim())
      uploadFormData.append('videoType', formData.videoType)
      uploadFormData.append('publishMode', publishMode)
      if (formData.gameId) {
        uploadFormData.append('gameId', formData.gameId)
      }
      if (tags.length > 0) {
        uploadFormData.append('tags', JSON.stringify(tags))
      }
      if (publishMode === 'scheduled' && scheduledDate && scheduledTime) {
        uploadFormData.append('scheduledPublishAt', `${scheduledDate}T${scheduledTime}`)
      }

      // Use XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100
          setUploadProgress(Math.round(percentComplete))
        }
      })

      xhr.addEventListener('load', () => {
        setIsUploading(false)
        if (xhr.status === 201) {
          try {
            const data = JSON.parse(xhr.responseText)
            // Redirect based on publish mode
            if (publishMode === 'now') {
              router.push(`/watch/${data.video.id}`)
            } else {
              // For draft or scheduled, go to creator dashboard
              router.push('/dashboard/videos')
            }
          } catch (e) {
            setError('Upload successful but failed to parse response')
            setUploadProgress(0)
          }
        } else {
          try {
            const data = JSON.parse(xhr.responseText)
            setError(data.error || `Upload failed with status ${xhr.status}`)
          } catch (e) {
            // Response is not JSON (likely HTML error page)
            if (xhr.status === 413) {
              setError('File is too large. Maximum size is 500MB.')
            } else if (xhr.status >= 500) {
              setError('Server error. Please try again later.')
            } else {
              setError(`Upload failed with status ${xhr.status}`)
            }
          }
          setUploadProgress(0)
        }
      })

      xhr.addEventListener('error', () => {
        setError('Upload failed. Please try again.')
        setIsUploading(false)
        setUploadProgress(0)
      })

      xhr.open('POST', '/api/upload')
      xhr.send(uploadFormData)

    } catch (err: any) {
      setError(err.message || 'Failed to upload video')
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Upload Video</h1>

      <form onSubmit={handleSubmit} className="bg-gray-900 rounded-lg p-6 space-y-6">
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* File Upload with Preview */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Video File *
          </label>
          <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-gray-600 transition-colors">
            {!file ? (
              <div>
                <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mt-2 text-sm text-gray-400">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  MP4, MOV, AVI, WebM up to 2GB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                >
                  Select File
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg className="h-10 w-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <div className="text-left">
                      <p className="text-white font-medium">{file.name}</p>
                      <p className="text-sm text-gray-400">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between text-sm text-gray-300 mb-2">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {uploadProgress < 100
                ? 'Uploading file...'
                : 'Processing video and generating thumbnail...'}
            </p>
          </div>
        )}

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
            Title *
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Give your video an awesome title"
            maxLength={100}
            required
            disabled={isUploading}
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
            placeholder="Describe your video..."
            maxLength={1000}
            disabled={isUploading}
          />
        </div>

        {/* Video Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Video Type *
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
              formData.videoType === 'CLIP'
                ? 'border-blue-500 bg-blue-900/20'
                : 'border-gray-700 hover:border-gray-600'
            }`}>
              <input
                type="radio"
                value="CLIP"
                checked={formData.videoType === 'CLIP'}
                onChange={(e) => setFormData({ ...formData, videoType: e.target.value as 'CLIP' })}
                className="sr-only"
                disabled={isUploading}
              />
              <div>
                <p className="text-white font-medium">Clip</p>
                <p className="text-sm text-gray-400">2s - 2 minutes</p>
              </div>
            </label>
            <label className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
              formData.videoType === 'FULL'
                ? 'border-blue-500 bg-blue-900/20'
                : 'border-gray-700 hover:border-gray-600'
            }`}>
              <input
                type="radio"
                value="FULL"
                checked={formData.videoType === 'FULL'}
                onChange={(e) => setFormData({ ...formData, videoType: e.target.value as 'FULL' })}
                className="sr-only"
                disabled={isUploading}
              />
              <div>
                <p className="text-white font-medium">Full Video</p>
                <p className="text-sm text-gray-400">10-30+ minutes</p>
              </div>
            </label>
          </div>
        </div>

        {/* Game Selection */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="game" className="block text-sm font-medium text-gray-300">
              Game (Optional)
            </label>
            <button
              type="button"
              onClick={() => setShowNewGameForm(!showNewGameForm)}
              className="text-sm text-blue-400 hover:text-blue-300"
              disabled={isUploading}
            >
              {showNewGameForm ? 'Cancel' : '+ Add New Game'}
            </button>
          </div>

          {showNewGameForm ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newGameName}
                onChange={(e) => setNewGameName(e.target.value)}
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Enter game name"
                disabled={isUploading}
              />
              <button
                type="button"
                onClick={handleCreateGame}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                disabled={isUploading}
              >
                Add
              </button>
            </div>
          ) : (
            <select
              id="game"
              value={formData.gameId}
              onChange={(e) => setFormData({ ...formData, gameId: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={isUploading}
            >
              <option value="">Select a game</option>
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Tags (Optional)
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Add a tag (press Enter)"
              disabled={isUploading}
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium"
              disabled={isUploading}
            >
              Add
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-900/30 text-blue-400 rounded-full text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-blue-300"
                    disabled={isUploading}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Publish Options */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Publish Options
          </label>
          <div className="space-y-3">
            {/* Publish Now */}
            <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
              publishMode === 'now'
                ? 'border-blue-500 bg-blue-900/20'
                : 'border-gray-700 hover:border-gray-600'
            }`}>
              <input
                type="radio"
                value="now"
                checked={publishMode === 'now'}
                onChange={() => setPublishMode('now')}
                className="sr-only"
                disabled={isUploading}
              />
              <div className="flex-1">
                <p className="text-white font-medium">Publish Now</p>
                <p className="text-sm text-gray-400">Video will be visible immediately after upload</p>
              </div>
              {publishMode === 'now' && (
                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </label>

            {/* Save as Draft */}
            <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
              publishMode === 'draft'
                ? 'border-blue-500 bg-blue-900/20'
                : 'border-gray-700 hover:border-gray-600'
            }`}>
              <input
                type="radio"
                value="draft"
                checked={publishMode === 'draft'}
                onChange={() => setPublishMode('draft')}
                className="sr-only"
                disabled={isUploading}
              />
              <div className="flex-1">
                <p className="text-white font-medium">Save as Draft</p>
                <p className="text-sm text-gray-400">Upload now, publish manually later from your dashboard</p>
              </div>
              {publishMode === 'draft' && (
                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </label>

            {/* Schedule */}
            <div className={`border-2 rounded-lg transition-all ${
              publishMode === 'scheduled'
                ? 'border-blue-500 bg-blue-900/20'
                : 'border-gray-700 hover:border-gray-600'
            }`}>
              <label className="flex items-center p-4 cursor-pointer">
                <input
                  type="radio"
                  value="scheduled"
                  checked={publishMode === 'scheduled'}
                  onChange={() => setPublishMode('scheduled')}
                  className="sr-only"
                  disabled={isUploading}
                />
                <div className="flex-1">
                  <p className="text-white font-medium">Schedule for Later</p>
                  <p className="text-sm text-gray-400">Choose when your video goes live</p>
                </div>
                {publishMode === 'scheduled' && (
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </label>

              {publishMode === 'scheduled' && (
                <div className="px-4 pb-4 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Date</label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                      disabled={isUploading}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Time</label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                      disabled={isUploading}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isUploading || !file}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isUploading
            ? (uploadProgress < 100 ? 'Uploading...' : 'Processing...')
            : publishMode === 'now'
              ? 'Upload & Publish'
              : publishMode === 'draft'
                ? 'Upload as Draft'
                : 'Upload & Schedule'}
        </button>
      </form>
    </div>
  )
}
