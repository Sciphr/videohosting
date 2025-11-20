'use client'

import { useRef, useState } from 'react'
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
  const playerRef = useRef<Player | null>(null)
  const [showClipCreator, setShowClipCreator] = useState(false)

  const handlePlayerReady = (player: Player) => {
    playerRef.current = player
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
      <div className="flex items-center justify-between">
        <LikeButton
          videoId={video.id}
          initialLikeCount={video.likeCount}
        />

        {isAuthenticated && (
          <button
            onClick={() => setShowClipCreator(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
            </svg>
            Create Clip
          </button>
        )}
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
