'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ProfileClientProps {
  userId: string
  isOwnProfile: boolean
  isFollowing: boolean
  user: any
}

export default function ProfileClient({ userId, isOwnProfile, isFollowing: initialFollowing }: ProfileClientProps) {
  const router = useRouter()
  const [isFollowing, setIsFollowing] = useState(initialFollowing)
  const [isLoading, setIsLoading] = useState(false)

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
      <Link
        href="/settings/profile"
        className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Edit Profile
      </Link>
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
