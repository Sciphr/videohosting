'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface VideoCardProps {
  id: string
  title: string
  thumbnailUrl?: string | null
  duration?: number | null
  viewCount: number
  uploader: {
    username: string
    displayName: string | null
  }
  createdAt: string | Date
  game?: {
    name: string
  } | null
}

export default function VideoCard({ id, title, thumbnailUrl, duration, viewCount, uploader, createdAt, game }: VideoCardProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Link href={`/watch/${id}`} className="group">
      <div className="bg-gray-900 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-gray-800">
          {thumbnailUrl ? (
            <img 
              src={thumbnailUrl} 
              alt={title}
              className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
          {duration && (
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded">
              {formatDuration(duration)}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="text-white font-semibold line-clamp-2 group-hover:text-blue-400 transition-colors">
            {title}
          </h3>
          <p className="text-gray-400 text-sm mt-1">
            {uploader.displayName || uploader.username}
          </p>
          <div className="flex items-center gap-2 mt-1 text-gray-500 text-sm">
            <span>{viewCount.toLocaleString()} views</span>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(createdAt), { addSuffix: true })}</span>
          </div>
          {game && (
            <div className="mt-2">
              <span className="inline-block bg-blue-900/30 text-blue-400 text-xs px-2 py-1 rounded">
                {game.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
