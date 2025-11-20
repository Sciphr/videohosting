'use client'

import { useRef } from 'react'
import VideoPlayer from '@/components/VideoPlayer'
import LikeButton from '@/components/LikeButton'
import CommentSection from '@/components/CommentSection'
import Player from 'video.js/dist/types/player'

interface WatchPageClientProps {
  video: {
    id: string
    fileUrl: string
    thumbnailUrl?: string | null
    likeCount: number
    commentCount: number
  }
}

export default function WatchPageClient({ video }: WatchPageClientProps) {
  const playerRef = useRef<Player | null>(null)

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

      {/* Like Button */}
      <div>
        <LikeButton
          videoId={video.id}
          initialLikeCount={video.likeCount}
        />
      </div>

      {/* Comments */}
      <CommentSection
        videoId={video.id}
        initialCommentCount={video.commentCount}
        onTimestampClick={handleTimestampClick}
      />
    </div>
  )
}
