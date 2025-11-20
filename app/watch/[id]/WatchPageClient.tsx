'use client'

import VideoPlayer from '@/components/VideoPlayer'

interface WatchPageClientProps {
  video: {
    id: string
    fileUrl: string
    thumbnailUrl?: string | null
  }
}

export default function WatchPageClient({ video }: WatchPageClientProps) {
  return (
    <div className="bg-black rounded-lg overflow-hidden mb-6">
      <VideoPlayer
        src={video.fileUrl}
        poster={video.thumbnailUrl || undefined}
        videoId={video.id}
      />
    </div>
  )
}
