'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function UploadPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoType: 'CLIP' as 'CLIP' | 'FULL',
    gameId: '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [games, setGames] = useState<any[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/upload')
    }
  }, [status, router])

  useEffect(() => {
    // Fetch games list
    fetch('/api/games')
      .then(res => res.json())
      .then(data => setGames(data.games || []))
      .catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a video file')
      return
    }

    setIsUploading(true)
    setError('')

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      const uploadData = await uploadRes.json()

      if (!uploadRes.ok) {
        throw new Error(uploadData.error || 'Upload failed')
      }

      // Now create the video entry
      // In a real app, this would be handled by the upload endpoint
      // For now, just redirect to home
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Failed to upload video')
      setIsUploading(false)
    }
  }

  if (status === 'loading') {
    return <div className="text-white">Loading...</div>
  }

  if (!session) {
    return null
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Upload Video</h1>

      <form onSubmit={handleSubmit} className="bg-gray-900 rounded-lg p-6 space-y-6">
        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Video File *
          </label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            required
          />
        </div>

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
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
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
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Video Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Video Type *
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="CLIP"
                checked={formData.videoType === 'CLIP'}
                onChange={(e) => setFormData({ ...formData, videoType: e.target.value as 'CLIP' })}
                className="mr-2"
              />
              <span className="text-gray-300">Clip (15s - 2min)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="FULL"
                checked={formData.videoType === 'FULL'}
                onChange={(e) => setFormData({ ...formData, videoType: e.target.value as 'FULL' })}
                className="mr-2"
              />
              <span className="text-gray-300">Full Video (10-30+ min)</span>
            </label>
          </div>
        </div>

        {/* Game */}
        <div>
          <label htmlFor="game" className="block text-sm font-medium text-gray-300 mb-2">
            Game (Optional)
          </label>
          <select
            id="game"
            value={formData.gameId}
            onChange={(e) => setFormData({ ...formData, gameId: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a game</option>
            {games.map((game) => (
              <option key={game.id} value={game.id}>
                {game.name}
              </option>
            ))}
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isUploading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isUploading ? 'Uploading...' : 'Upload Video'}
        </button>
      </form>
    </div>
  )
}
