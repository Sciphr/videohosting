'use client'

import { useState } from 'react'

interface EditProfileModalProps {
  user: {
    id: string
    username: string
    displayName?: string | null
    bio?: string | null
    avatarUrl?: string | null
  }
  onClose: () => void
  onUpdate: () => void
}

export default function EditProfileModal({ user, onClose, onUpdate }: EditProfileModalProps) {
  const [formData, setFormData] = useState({
    displayName: user.displayName || '',
    bio: user.bio || '',
    avatarUrl: user.avatarUrl || '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update profile')
      }

      onUpdate()
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Edit Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-900/50 border border-red-700 rounded-lg p-3">
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Display Name */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-2">
              Display Name
            </label>
            <input
              type="text"
              id="displayName"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={user.username}
            />
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-2">
              Bio
            </label>
            <textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tell us about yourself..."
            />
          </div>

          {/* Avatar URL */}
          <div>
            <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-300 mb-2">
              Avatar URL
            </label>
            <input
              type="url"
              id="avatarUrl"
              value={formData.avatarUrl}
              onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/avatar.jpg"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
