'use client'

import { useState } from 'react'

interface FollowButtonProps {
  userId: string
  initialIsFollowing: boolean
  initialFollowerCount: number
  currentUserId?: string
}

export default function FollowButton({
  userId,
  initialIsFollowing,
  initialFollowerCount,
  currentUserId
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [followerCount, setFollowerCount] = useState(initialFollowerCount)
  const [isLoading, setIsLoading] = useState(false)

  const handleFollow = async () => {
    if (!currentUserId) {
      window.location.href = '/login'
      return
    }

    setIsLoading(true)
    try {
      const method = isFollowing ? 'DELETE' : 'POST'
      const res = await fetch(`/api/users/${userId}/follow`, {
        method,
        headers: { 'Content-Type': 'application/json' },
      })

      if (res.ok) {
        setIsFollowing(!isFollowing)
        setFollowerCount(prev => isFollowing ? prev - 1 : prev + 1)
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (currentUserId === userId) {
    return null // Don't show follow button on own profile
  }

  return (
    <button
      onClick={handleFollow}
      disabled={isLoading}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 shadow-lg
        ${isFollowing
          ? 'bg-gray-700 hover:bg-gray-600 text-white border-2 border-gray-600'
          : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-purple-500/50 hover:shadow-purple-500/80'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      <svg className="w-4 h-4" fill={isFollowing ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
      {isLoading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
      <span className="text-xs opacity-75">
        {followerCount}
      </span>
    </button>
  )
}
