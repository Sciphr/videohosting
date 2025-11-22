'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface UserProfile {
  id: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  bannerUrl: string | null
  bio: string | null
  isPrivate: boolean
  emailNotifications: boolean
}

export default function EditProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    isPrivate: false,
    emailNotifications: true,
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/settings/profile')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user?.id) {
      fetchProfile()
    }
  }, [session?.user?.id])

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/users/${session?.user?.id}`)
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        setFormData({
          displayName: data.user.displayName || '',
          bio: data.user.bio || '',
          isPrivate: data.user.isPrivate || false,
          emailNotifications: data.user.emailNotifications ?? true,
        })
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        const data = await res.json()
        setUser({ ...user, ...data.user })
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploadingAvatar(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`/api/users/${user.id}/avatar`, {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        setUser({ ...user, avatarUrl: data.avatarUrl })
        setMessage({ type: 'success', text: 'Avatar updated!' })
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Failed to upload avatar' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to upload avatar' })
    } finally {
      setUploadingAvatar(false)
      if (avatarInputRef.current) {
        avatarInputRef.current.value = ''
      }
    }
  }

  const handleRemoveAvatar = async () => {
    if (!user || !user.avatarUrl) return

    setUploadingAvatar(true)
    setMessage(null)

    try {
      const res = await fetch(`/api/users/${user.id}/avatar`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setUser({ ...user, avatarUrl: null })
        setMessage({ type: 'success', text: 'Avatar removed!' })
      } else {
        setMessage({ type: 'error', text: 'Failed to remove avatar' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to remove avatar' })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploadingBanner(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`/api/users/${user.id}/banner`, {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        setUser({ ...user, bannerUrl: data.bannerUrl })
        setMessage({ type: 'success', text: 'Banner updated!' })
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Failed to upload banner' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to upload banner' })
    } finally {
      setUploadingBanner(false)
      if (bannerInputRef.current) {
        bannerInputRef.current.value = ''
      }
    }
  }

  const handleRemoveBanner = async () => {
    if (!user || !user.bannerUrl) return

    setUploadingBanner(true)
    setMessage(null)

    try {
      const res = await fetch(`/api/users/${user.id}/banner`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setUser({ ...user, bannerUrl: null })
        setMessage({ type: 'success', text: 'Banner removed!' })
      } else {
        setMessage({ type: 'error', text: 'Failed to remove banner' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to remove banner' })
    } finally {
      setUploadingBanner(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-800 rounded w-48" />
          <div className="h-48 bg-gray-800 rounded" />
          <div className="h-32 bg-gray-800 rounded" />
        </div>
      </div>
    )
  }

  if (!session || !user) {
    return null
  }

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Edit Profile</h1>
          <p className="text-gray-400 text-sm mt-1">
            Customize your profile and channel appearance
          </p>
        </div>
        <Link
          href={`/profile/${user.id}`}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
        >
          View Profile
        </Link>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-900/50 border border-green-500 text-green-200'
            : 'bg-red-900/50 border border-red-500 text-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-8">
        {/* Banner Section */}
        <section className="bg-gray-900 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">Channel Banner</h2>
            <p className="text-sm text-gray-400">Recommended size: 1920x480 pixels</p>
          </div>

          <div className="relative">
            {/* Banner Preview */}
            <div className="h-48 bg-gray-800 overflow-hidden">
              {user.bannerUrl ? (
                <img
                  src={user.bannerUrl}
                  alt="Channel banner"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-900/50 to-purple-900/50">
                  <span className="text-gray-500">No banner image</span>
                </div>
              )}
            </div>

            {/* Banner Actions */}
            <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleBannerUpload}
                className="hidden"
              />
              <button
                onClick={() => bannerInputRef.current?.click()}
                disabled={uploadingBanner}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg font-medium transition-colors"
              >
                {uploadingBanner ? 'Uploading...' : 'Change Banner'}
              </button>
              {user.bannerUrl && (
                <button
                  onClick={handleRemoveBanner}
                  disabled={uploadingBanner}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white rounded-lg font-medium transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Avatar Section */}
        <section className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Profile Picture</h2>

          <div className="flex items-center gap-6">
            {/* Avatar Preview */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gray-800 overflow-hidden">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="Profile picture"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-4xl font-bold">
                    {(user.displayName || user.username)[0].toUpperCase()}
                  </div>
                )}
              </div>
              {uploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Avatar Actions */}
            <div className="flex flex-col gap-2">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg font-medium transition-colors"
              >
                Upload New Picture
              </button>
              {user.avatarUrl && (
                <button
                  onClick={handleRemoveAvatar}
                  disabled={uploadingAvatar}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Remove Picture
                </button>
              )}
              <p className="text-xs text-gray-500 mt-1">
                JPEG, PNG, WebP or GIF. Max 5MB.
              </p>
            </div>
          </div>
        </section>

        {/* Profile Info Section */}
        <section className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Profile Information</h2>

          <div className="space-y-4">
            {/* Username (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                value={user.username}
                disabled
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
            </div>

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
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Your display name"
                maxLength={50}
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
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                placeholder="Tell viewers about yourself..."
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">{formData.bio.length}/500 characters</p>
            </div>
          </div>
        </section>

        {/* Privacy Settings */}
        <section className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Privacy & Notifications</h2>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 bg-gray-800 rounded-lg cursor-pointer">
              <div>
                <p className="text-white font-medium">Private Profile</p>
                <p className="text-sm text-gray-400">Hide your profile from non-followers</p>
              </div>
              <input
                type="checkbox"
                checked={formData.isPrivate}
                onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                className="w-5 h-5 rounded border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-gray-800 rounded-lg cursor-pointer">
              <div>
                <p className="text-white font-medium">Email Notifications</p>
                <p className="text-sm text-gray-400">Receive email updates about your channel</p>
              </div>
              <input
                type="checkbox"
                checked={formData.emailNotifications}
                onChange={(e) => setFormData({ ...formData, emailNotifications: e.target.checked })}
                className="w-5 h-5 rounded border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
              />
            </label>
          </div>
        </section>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Link
            href={`/profile/${user.id}`}
            className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg font-medium transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
