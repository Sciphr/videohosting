'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface LikeButtonProps {
  videoId: string
  initialLikeCount: number
  initialIsLiked?: boolean
}

export default function LikeButton({ videoId, initialLikeCount, initialIsLiked = false }: LikeButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check if user has liked the video
    if (session?.user?.id) {
      fetch(`/api/videos/${videoId}/like`)
        .then(res => res.json())
        .then(data => setIsLiked(data.liked))
        .catch(() => {})
    }
  }, [videoId, session])

  const handleLike = async () => {
    if (!session) {
      router.push('/login?callbackUrl=' + window.location.pathname)
      return
    }

    setIsLoading(true)
    const method = isLiked ? 'DELETE' : 'POST'

    try {
      const res = await fetch(`/api/videos/${videoId}/like`, { method })

      if (res.ok) {
        setIsLiked(!isLiked)
        setLikeCount(prev => isLiked ? prev - 1 : prev + 1)
      }
    } catch (error) {
      console.error('Failed to toggle like:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleLike}
      disabled={isLoading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
        isLiked
          ? 'bg-red-600 hover:bg-red-700 text-white'
          : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <svg
        className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`}
        fill={isLiked ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      <span>{likeCount}</span>
    </button>
  )
}
