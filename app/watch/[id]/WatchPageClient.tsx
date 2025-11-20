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

  const handleTimestampClick = (timestamp: number) => {
    // For now, we'll just log it. In a full implementation,
    // we'd need to expose the player instance from VideoPlayer
    console.log('Jump to timestamp:', timestamp)
    // TODO: Implement player.currentTime(timestamp) when VideoPlayer exposes the ref
  }

  return (
    <div className="space-y-6">
      <div className="bg-black rounded-lg overflow-hidden">
        <VideoPlayer
          src={video.fileUrl}
          poster={video.thumbnailUrl || undefined}
          videoId={video.id}
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
