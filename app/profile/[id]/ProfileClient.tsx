'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import EditProfileModal from './EditProfileModal'

interface ProfileClientProps {
  userId: string
  isOwnProfile: boolean
  isFollowing: boolean
  user: any
}

export default function ProfileClient({ userId, isOwnProfile, isFollowing: initialFollowing, user }: ProfileClientProps) {
  const router = useRouter()
  const [isFollowing, setIsFollowing] = useState(initialFollowing)
  const [isLoading, setIsLoading] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const handleFollow = async () => {
    setIsLoading(true)
    try {
      const method = isFollowing ? 'DELETE' : 'POST'
      const res = await fetch(`/api/users/${userId}/follow`, { method })

      if (res.ok) {
        setIsFollowing(!isFollowing)
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isOwnProfile) {
    return (
      <>
        <button
          onClick={() => setShowEditModal(true)}
          className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
        >
          Edit Profile
        </button>
        
        {showEditModal && (
          <EditProfileModal
            user={user}
            onClose={() => setShowEditModal(false)}
            onUpdate={() => {
              setShowEditModal(false)
              router.refresh()
            }}
          />
        )}
      </>
    )
  }

  return (
    <button
      onClick={handleFollow}
      disabled={isLoading}
      className={`px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        isFollowing
          ? 'bg-gray-800 hover:bg-gray-700 text-white'
          : 'bg-blue-600 hover:bg-blue-700 text-white'
      }`}
    >
      {isFollowing ? 'Unfollow' : 'Follow'}
    </button>
  )
}
