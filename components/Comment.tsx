'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface CommentProps {
  comment: {
    id: string
    text: string
    videoTimestamp?: number | null
    createdAt: string | Date
    editedAt?: string | Date | null
    user: {
      id: string
      username: string
      displayName: string | null
      avatarUrl: string | null
    }
    replies?: any[]
  }
  videoId: string
  onReply?: (commentId: string) => void
  onDelete?: (commentId: string) => void
  onTimestampClick?: (timestamp: number) => void
}

export default function Comment({ comment, videoId, onReply, onDelete, onTimestampClick }: CommentProps) {
  const { data: session } = useSession()
  const [showReplies, setShowReplies] = useState(false)
  const isOwner = session?.user?.id === comment.user.id

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {comment.user.avatarUrl ? (
            <img
              src={comment.user.avatarUrl}
              alt={comment.user.displayName || comment.user.username}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
              <span className="text-gray-300 font-medium">
                {(comment.user.displayName || comment.user.username)[0].toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/profile/${comment.user.id}`}
              className="font-medium text-white hover:text-blue-400"
            >
              {comment.user.displayName || comment.user.username}
            </Link>
            <span className="text-gray-500 text-sm">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
            {comment.editedAt && (
              <span className="text-gray-500 text-sm">(edited)</span>
            )}
            {comment.videoTimestamp !== null && comment.videoTimestamp !== undefined && (
              <button
                onClick={() => onTimestampClick?.(comment.videoTimestamp!)}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                {formatTimestamp(comment.videoTimestamp)}
              </button>
            )}
          </div>

          <p className="text-gray-300 whitespace-pre-wrap break-words">
            {comment.text}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-2">
            {session && (
              <button
                onClick={() => onReply?.(comment.id)}
                className="text-sm text-gray-400 hover:text-white"
              >
                Reply
              </button>
            )}
            {isOwner && onDelete && (
              <button
                onClick={() => onDelete(comment.id)}
                className="text-sm text-gray-400 hover:text-red-400"
              >
                Delete
              </button>
            )}
            {comment.replies && comment.replies.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                {showReplies ? 'Hide' : 'Show'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      {showReplies && comment.replies && comment.replies.length > 0 && (
        <div className="ml-12 space-y-3 border-l-2 border-gray-800 pl-4">
          {comment.replies.map((reply: any) => (
            <Comment
              key={reply.id}
              comment={reply}
              videoId={videoId}
              onReply={onReply}
              onDelete={onDelete}
              onTimestampClick={onTimestampClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}
