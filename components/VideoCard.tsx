'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Video } from '@/types'

interface VideoCardProps {
  video: Video
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export default function VideoCard({ video }: VideoCardProps) {
  return (
    <Link href={`/watch/${video.id}`} className="group block">
      <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden">
        {video.thumbnailPath ? (
          <Image
            src={video.thumbnailPath}
            alt={video.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
          {formatDuration(video.duration)}
        </div>

        {/* Video type badge */}
        <div className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded font-medium ${
          video.videoType === 'CLIP'
            ? 'bg-purple-600 text-white'
            : 'bg-blue-600 text-white'
        }`}>
          {video.videoType === 'CLIP' ? 'Clip' : 'Full Video'}
        </div>

        {/* Play overlay on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <h3 className="text-white font-medium line-clamp-2 group-hover:text-purple-400 transition-colors">
          {video.title}
        </h3>
        <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
          {video.user && (
            <span>{video.user.username}</span>
          )}
          {video.gameTitle && (
            <>
              <span>•</span>
              <span className="text-purple-400">{video.gameTitle}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
          <span>{video.viewCount.toLocaleString()} views</span>
          <span>•</span>
          <span>{formatDate(video.createdAt)}</span>
        </div>
      </div>
    </Link>
  )
}
