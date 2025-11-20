'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Comment from './Comment'

interface CommentSectionProps {
  videoId: string
  initialCommentCount: number
  onTimestampClick?: (timestamp: number) => void
}

export default function CommentSection({ videoId, initialCommentCount, onTimestampClick }: CommentSectionProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [comments, setComments] = useState<any[]>([])
  const [commentText, setCommentText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [commentCount, setCommentCount] = useState(initialCommentCount)

  useEffect(() => {
    fetchComments()
  }, [videoId])

  const fetchComments = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/videos/${videoId}/comments`)
      const data = await res.json()
      setComments(data.comments || [])
      setCommentCount(data.pagination?.total || 0)
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session) {
      router.push('/login?callbackUrl=' + window.location.pathname)
      return
    }

    if (!commentText.trim()) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/videos/${videoId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: commentText,
          parentId: replyingTo,
        }),
      })

      if (res.ok) {
        setCommentText('')
        setReplyingTo(null)
        fetchComments()
      }
    } catch (error) {
      console.error('Failed to post comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchComments()
      }
    } catch (error) {
      console.error('Failed to delete comment:', error)
    }
  }

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId)
    // Scroll to comment form or focus input
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-6">
        {commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}
      </h2>

      {/* Comment Form */}
      {session ? (
        <form onSubmit={handleSubmit} className="mb-8">
          {replyingTo && (
            <div className="mb-2 flex items-center gap-2">
              <span className="text-sm text-gray-400">Replying to comment</span>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Cancel
              </button>
            </div>
          )}
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || ''}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                  <span className="text-gray-300 font-medium">
                    {(session.user.name || 'U')[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCommentText('')
                    setReplyingTo(null)
                  }}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !commentText.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Posting...' : 'Comment'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-gray-800 rounded-lg text-center">
          <p className="text-gray-400 mb-2">Sign in to leave a comment</p>
          <button
            onClick={() => router.push('/login?callbackUrl=' + window.location.pathname)}
            className="text-blue-400 hover:text-blue-300 font-medium"
          >
            Sign In
          </button>
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-gray-400">Loading comments...</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              videoId={videoId}
              onReply={handleReply}
              onDelete={handleDelete}
              onTimestampClick={onTimestampClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}
