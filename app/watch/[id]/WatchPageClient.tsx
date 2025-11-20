'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import VideoPlayer from '@/components/VideoPlayer'
import LikeButton from '@/components/LikeButton'
import CommentSection from '@/components/CommentSection'
import ClipCreator from '@/components/ClipCreator'
import Player from 'video.js/dist/types/player'

interface WatchPageClientProps {
  video: {
    id: string
    fileUrl: string
    thumbnailUrl?: string | null
    likeCount: number
    commentCount: number
  }
  isAuthenticated: boolean
}

export default function WatchPageClient({ video, isAuthenticated }: WatchPageClientProps) {
  const router = useRouter()
  const playerRef = useRef<Player | null>(null)
  const [showClipCreator, setShowClipCreator] = useState(false)
  const [isCreatingParty, setIsCreatingParty] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  const handlePlayerReady = (player: Player) => {
    playerRef.current = player
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}/watch/${video.id}`
    navigator.clipboard.writeText(url)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const handleStartWatchParty = async () => {
    try {
      setIsCreatingParty(true)
      const res = await fetch('/api/watch-party', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoId: video.id }),
      })

      if (!res.ok) {
        throw new Error('Failed to create watch party')
      }

      const watchParty = await res.json()
      router.push(`/party/${watchParty.roomCode}`)
    } catch (error) {
      console.error('Failed to create watch party:', error)
      alert('Failed to create watch party. Please try again.')
    } finally {
      setIsCreatingParty(false)
    }
  }

  const handleTimestampClick = (timestamp: number) => {
    if (playerRef.current) {
      playerRef.current.currentTime(timestamp)
      playerRef.current.play()
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-black rounded-lg overflow-hidden">
        <VideoPlayer
          src={video.fileUrl}
          poster={video.thumbnailUrl || undefined}
          videoId={video.id}
          onPlayerReady={handlePlayerReady}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <LikeButton
          videoId={video.id}
          initialLikeCount={video.likeCount}
        />

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            {linkCopied ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </>
            )}
          </button>

          {isAuthenticated && (
            <>
              <button
                onClick={handleStartWatchParty}
                disabled={isCreatingParty}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {isCreatingParty ? 'Creating...' : 'Watch Party'}
              </button>
              <button
                onClick={() => setShowClipCreator(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                </svg>
                Create Clip
              </button>
            </>
          )}
        </div>
      </div>

      {/* Comments */}
      <CommentSection
        videoId={video.id}
        initialCommentCount={video.commentCount}
        onTimestampClick={handleTimestampClick}
      />

      {/* Clip Creator Modal */}
      {showClipCreator && (
        <ClipCreator
          videoId={video.id}
          player={playerRef.current}
          onClose={() => setShowClipCreator(false)}
          onClipCreated={() => setShowClipCreator(false)}
        />
      )}
    </div>
  )
}
