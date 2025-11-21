'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import VideoPlayer from '@/components/VideoPlayer'
import LikeButton from '@/components/LikeButton'
import CommentSection from '@/components/CommentSection'
import ClipCreator from '@/components/ClipCreator'
import EditVideoModal from '@/components/EditVideoModal'
import Player from 'video.js/dist/types/player'

interface WatchPageClientProps {
  video: {
    id: string
    fileUrl: string
    thumbnailUrl?: string | null
    likeCount: number
    commentCount: number
  }
  fullVideo: any
  isAuthenticated: boolean
  currentUserId?: string
}

export default function WatchPageClient({ video, fullVideo, isAuthenticated, currentUserId }: WatchPageClientProps) {
  const router = useRouter()
  const playerRef = useRef<Player | null>(null)
  const [showClipCreator, setShowClipCreator] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [isCreatingParty, setIsCreatingParty] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [timestampCopied, setTimestampCopied] = useState(false)
  const [theaterMode, setTheaterMode] = useState(false)

  const isVideoOwner = currentUserId && fullVideo.uploaderId === currentUserId

  const handlePlayerReady = (player: Player) => {
    playerRef.current = player
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}/watch/${video.id}`
    navigator.clipboard.writeText(url)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const handleCopyTimestamp = () => {
    if (playerRef.current) {
      const currentTime = Math.floor(playerRef.current.currentTime())
      const url = `${window.location.origin}/watch/${video.id}?t=${currentTime}`
      navigator.clipboard.writeText(url)
      setTimestampCopied(true)
      setTimeout(() => setTimestampCopied(false), 2000)
    }
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = video.fileUrl
    link.download = `${fullVideo.title}.mp4`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleStartWatchParty = async () => {
    try {
      setIsCreatingParty(true)
      const res = await fetch('/api/watch-party', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoId: video.id }),
      })

      if (!res.ok) {
        throw new Error('Failed to create watch party')
      }

      const watchParty = await res.json()
      router.push(`/party/${watchParty.roomCode}`)
    } catch (error) {
      console.error('Failed to create watch party:', error)
      alert('Failed to create watch party. Please try again.')
    } finally {
      setIsCreatingParty(false)
    }
  }

  const handleTimestampClick = (timestamp: number) => {
    if (playerRef.current) {
      playerRef.current.currentTime(timestamp)
      playerRef.current.play()
    }
  }

  const handleVideoSaved = () => {
    router.refresh()
  }

  return (
    <div className={`space-y-6 ${theaterMode ? 'fixed inset-0 z-50 bg-black p-4 overflow-y-auto' : ''}`}>
      <div className={`bg-black rounded-lg overflow-hidden ${theaterMode ? 'w-full h-[80vh]' : ''}`}>
        <VideoPlayer
          src={video.fileUrl}
          poster={video.thumbnailUrl || undefined}
          videoId={video.id}
          onPlayerReady={handlePlayerReady}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <LikeButton
            videoId={video.id}
            initialLikeCount={video.likeCount}
          />

          <button
            onClick={() => setTheaterMode(!theaterMode)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            title="Theater Mode"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            {theaterMode ? 'Exit' : 'Theater'}
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            {linkCopied ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </>
            )}
          </button>

          <button
            onClick={handleCopyTimestamp}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-cyan-500/50 hover:shadow-cyan-500/80"
            title="Copy link with current timestamp"
          >
            {timestampCopied ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Copy @ Time
              </>
            )}
          </button>

          {isVideoOwner && (
            <>
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>

              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-green-500/50 hover:shadow-green-500/80"
                title="Download video"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>
            </>
          )}

          {isAuthenticated && (
            <>
              <button
                onClick={handleStartWatchParty}
                disabled={isCreatingParty}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {isCreatingParty ? 'Creating...' : 'Watch Party'}
              </button>
              <button
                onClick={() => setShowClipCreator(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                </svg>
                Create Clip
              </button>
            </>
          )}
        </div>
      </div>

      {/* Comments */}
      <CommentSection
        videoId={video.id}
        initialCommentCount={video.commentCount}
        onTimestampClick={handleTimestampClick}
      />

      {/* Clip Creator Modal */}
      {showClipCreator && (
        <ClipCreator
          videoId={video.id}
          player={playerRef.current}
          onClose={() => setShowClipCreator(false)}
          onClipCreated={() => setShowClipCreator(false)}
        />
      )}

      {/* Edit Video Modal */}
      {showEditModal && (
        <EditVideoModal
          video={fullVideo}
          onClose={() => setShowEditModal(false)}
          onSaved={handleVideoSaved}
        />
      )}
    </div>
  )
}
