'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface ClipCardProps {
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

export default function ClipCard({ id, title, thumbnailUrl, duration, viewCount, uploader, createdAt, game }: ClipCardProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Link href={`/watch/${id}`} className="group block">
      <div className="relative bg-gray-900 rounded-2xl overflow-hidden border-2 border-gray-800 hover:border-cyan-500 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-500/30 hover:-rotate-1">
        {/* Thumbnail with overlay gradient */}
        <div className="relative aspect-[9/16] bg-gray-800 overflow-hidden">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
              <svg className="w-24 h-24 group-hover:text-cyan-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}

          {/* Dark gradient overlay from bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-80"></div>

          {/* Duration badge */}
          {duration && (
            <div className="absolute top-3 right-3 bg-black/90 text-white text-xs font-bold px-2 py-1 rounded-full backdrop-blur-sm border border-gray-700">
              {formatDuration(duration)}
            </div>
          )}

          {/* Clip badge */}
          <div className="absolute top-3 left-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg shadow-cyan-500/50">
            CLIP
          </div>

          {/* Content overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            {/* Title */}
            <h3 className="text-lg font-bold line-clamp-2 mb-2 group-hover:text-cyan-400 transition-colors">
              {title}
            </h3>

            {/* User info */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold shadow-lg">
                {(uploader.displayName || uploader.username).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {uploader.displayName || uploader.username}
                </p>
              </div>
            </div>

            {/* Stats and game */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {viewCount >= 1000 ? `${(viewCount / 1000).toFixed(1)}K` : viewCount}
                </span>
                <span className="text-gray-400">
                  {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
                </span>
              </div>

              {game && (
                <span className="inline-block bg-purple-600/80 text-white text-xs px-2 py-1 rounded-full font-semibold backdrop-blur-sm">
                  {game.name}
                </span>
              )}
            </div>
          </div>

          {/* Hover play overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center backdrop-blur-sm transform scale-75 group-hover:scale-100 transition-transform duration-300 shadow-2xl shadow-cyan-500/50">
              <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
