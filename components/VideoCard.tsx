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
      <div className="bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-800 hover:border-blue-500 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/20">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-gray-800 overflow-hidden">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600">
              <svg className="w-16 h-16 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
          {duration && (
            <div className="absolute bottom-2 right-2 bg-black/90 text-white text-xs px-2 py-1 rounded backdrop-blur-sm border border-gray-700">
              {formatDuration(duration)}
            </div>
          )}
          {/* Hover overlay with play icon */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-blue-600/80 flex items-center justify-center backdrop-blur-sm transform scale-75 group-hover:scale-100 transition-transform duration-300">
              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
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
