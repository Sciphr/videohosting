'use client'

import { useState } from 'react'
import Link from 'next/link'
import FollowButton from './FollowButton'

interface VideoInfoSectionProps {
  video: any
  currentUserId?: string
}

export default function VideoInfoSection({ video, currentUserId }: VideoInfoSectionProps) {
  const [showFullDescription, setShowFullDescription] = useState(false)
  const descriptionLimit = 300
  const needsReadMore = video.description && video.description.length > descriptionLimit

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <h1 className="text-2xl font-bold text-white mb-4">
        {video.title}
      </h1>

      <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
        <div className="flex items-center gap-4 flex-wrap">
          <Link
            href={`/profile/${video.uploader.id}`}
            className="text-blue-400 hover:text-blue-300 font-medium text-lg"
          >
            {video.uploader.displayName || video.uploader.username}
          </Link>

          <FollowButton
            userId={video.uploader.id}
            initialIsFollowing={video.uploader.isFollowing || false}
            initialFollowerCount={video.uploader.followerCount || 0}
            currentUserId={currentUserId}
          />

          {video.game && (
            <Link
              href={`/search?q=${encodeURIComponent(video.game.name)}&type=videos`}
              className="bg-blue-900/50 hover:bg-blue-800/50 text-blue-300 hover:text-blue-200 text-sm px-3 py-1 rounded border border-blue-500/30 transition-all cursor-pointer"
            >
              {video.game.name}
            </Link>
          )}
          <span className="text-gray-500 text-sm">•</span>
          <span className="text-gray-400 text-sm">
            {new Date(video.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </span>
        </div>
        <div className="text-gray-400 text-sm">
          {video.viewCount.toLocaleString()} views
        </div>
      </div>

      {/* Tags */}
      {video.tags && video.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {video.tags.map((videoTag: any) => (
            <Link
              key={videoTag.tag.id}
              href={`/search?q=${encodeURIComponent(videoTag.tag.name)}`}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs px-3 py-1 rounded-full transition-colors cursor-pointer"
            >
              #{videoTag.tag.name}
            </Link>
          ))}
        </div>
      )}

      {video.description && (
        <div className="border-t border-gray-800 pt-4">
          <p className="text-gray-300 whitespace-pre-wrap">
            {needsReadMore && !showFullDescription
              ? video.description.substring(0, descriptionLimit) + '...'
              : video.description
            }
          </p>
          {needsReadMore && (
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="mt-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
            >
              {showFullDescription ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
