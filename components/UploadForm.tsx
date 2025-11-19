'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { VideoType } from '@/types'

export default function UploadForm() {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoType: 'CLIP' as VideoType,
    gameTitle: ''
  })
  const [videoFile, setVideoFile] = useState<File | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!videoFile) {
      setError('Please select a video file')
      return
    }

    setIsUploading(true)
    setError('')

    try {
      const data = new FormData()
      data.append('video', videoFile)
      data.append('title', formData.title)
      data.append('description', formData.description)
      data.append('videoType', formData.videoType)
      data.append('gameTitle', formData.gameTitle)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: data
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Upload failed')
      }

      const result = await response.json()
      router.push(`/watch/${result.video.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        setError('Please select a valid video file')
        return
      }
      // Validate file size (500MB max)
      if (file.size > 524288000) {
        setError('File size must be less than 500MB')
        return
      }
      setVideoFile(file)
      setError('')

      // Auto-fill title from filename if empty
      if (!formData.title) {
        const name = file.name.replace(/\.[^/.]+$/, '')
        setFormData(prev => ({ ...prev, title: name }))
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Video File Input */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Video File
        </label>
        <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-purple-500 transition-colors">
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="hidden"
            id="video-upload"
          />
          <label htmlFor="video-upload" className="cursor-pointer">
            {videoFile ? (
              <div>
                <svg className="w-12 h-12 mx-auto text-green-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-white font-medium">{videoFile.name}</p>
                <p className="text-sm text-gray-400 mt-1">
                  {(videoFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div>
                <svg className="w-12 h-12 mx-auto text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-gray-400">
                  <span className="text-purple-400 font-medium">Click to upload</span> or drag and drop
                </p>
                <p className="text-sm text-gray-500 mt-1">MP4, MOV, WebM (max 500MB)</p>
              </div>
            )}
          </label>
        </div>
      </div>

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
          Title
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          required
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          placeholder="Epic clutch moment..."
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
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
          placeholder="Tell us about this video..."
        />
      </div>

      {/* Video Type */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Video Type
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, videoType: 'CLIP' }))}
            className={`p-4 rounded-lg border-2 transition-colors ${
              formData.videoType === 'CLIP'
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-gray-700 hover:border-gray-600'
            }`}
          >
            <svg className="w-8 h-8 mx-auto mb-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="font-medium text-white">Quick Clip</p>
            <p className="text-xs text-gray-400 mt-1">15s - 2min highlights</p>
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, videoType: 'FULL' }))}
            className={`p-4 rounded-lg border-2 transition-colors ${
              formData.videoType === 'FULL'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-700 hover:border-gray-600'
            }`}
          >
            <svg className="w-8 h-8 mx-auto mb-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="font-medium text-white">Full Video</p>
            <p className="text-xs text-gray-400 mt-1">10+ min sessions</p>
          </button>
        </div>
      </div>

      {/* Game Title */}
      <div>
        <label htmlFor="gameTitle" className="block text-sm font-medium text-gray-300 mb-2">
          Game
        </label>
        <input
          type="text"
          id="gameTitle"
          value={formData.gameTitle}
          onChange={(e) => setFormData(prev => ({ ...prev, gameTitle: e.target.value }))}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          placeholder="League of Legends, Valorant, etc."
        />
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Uploading...</span>
            <span className="text-purple-400">{uploadProgress}%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isUploading || !videoFile}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
      >
        {isUploading ? 'Uploading...' : 'Upload Video'}
      </button>
    </form>
  )
}
