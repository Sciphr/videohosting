'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface FeaturedHeroProps {
  video: {
    id: string
    title: string
    description?: string | null
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
}

export default function FeaturedHero({ video }: FeaturedHeroProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-900/20 via-gray-900 to-blue-900/20 shadow-2xl shadow-purple-500/20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
        {/* Left side - Video thumbnail */}
        <Link href={`/watch/${video.id}`} className="group relative">
          <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-gray-800 group-hover:border-cyan-500 transition-all duration-300">
            {video.thumbnailUrl ? (
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-600">
                <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}

            {/* Featured badge */}
            <div className="absolute top-3 left-3 px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1 animate-pulse-glow">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              FEATURED
            </div>

            {video.duration && (
              <div className="absolute bottom-3 right-3 bg-black/90 text-white text-sm px-2 py-1 rounded backdrop-blur-sm border border-gray-700">
                {formatDuration(video.duration)}
              </div>
            )}

            {/* Play overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-cyan-500/80 flex items-center justify-center backdrop-blur-sm transform scale-75 group-hover:scale-100 transition-transform duration-300 shadow-xl shadow-cyan-500/50">
                <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>
        </Link>

        {/* Right side - Video info */}
        <div className="flex flex-col justify-center space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Featured Video</span>
              {video.game && (
                <>
                  <span className="text-gray-600">•</span>
                  <span className="inline-block bg-purple-900/50 text-purple-300 text-xs px-2 py-1 rounded border border-purple-500/30">
                    {video.game.name}
                  </span>
                </>
              )}
            </div>

            <Link href={`/watch/${video.id}`}>
              <h1 className="text-4xl font-bold text-white mb-3 hover:text-cyan-400 transition-colors line-clamp-2">
                {video.title}
              </h1>
            </Link>

            {video.description && (
              <p className="text-gray-300 line-clamp-3 mb-4">
                {video.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4 text-gray-400">
            <Link
              href={`/profile/${video.uploader.username}`}
              className="flex items-center gap-2 hover:text-white transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {(video.uploader.displayName || video.uploader.username).charAt(0).toUpperCase()}
              </div>
              <span className="font-medium">
                {video.uploader.displayName || video.uploader.username}
              </span>
            </Link>

            <span>•</span>
            <span className="flex items-center gap-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {video.viewCount.toLocaleString()} views
            </span>

            <span>•</span>
            <span>{formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}</span>
          </div>

          <Link
            href={`/watch/${video.id}`}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg font-bold text-lg shadow-xl shadow-cyan-500/50 hover:shadow-cyan-500/80 transition-all duration-300 transform hover:scale-105"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Watch Now
          </Link>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -z-10"></div>
    </div>
  )
}
