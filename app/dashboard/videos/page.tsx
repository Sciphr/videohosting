'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Video {
  id: string
  title: string
  description: string | null
  status: 'PROCESSING' | 'DRAFT' | 'SCHEDULED' | 'READY' | 'FAILED' | 'DELETED'
  thumbnailUrl: string | null
  duration: number | null
  viewCount: number
  likeCount: number
  commentCount: number
  createdAt: string
  publishedAt: string | null
  scheduledPublishAt: string | null
  game: {
    id: string
    name: string
  } | null
}

type TabType = 'all' | 'published' | 'drafts' | 'scheduled'

export default function CreatorDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/dashboard/videos')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user?.id) {
      fetchVideos()
    }
  }, [session?.user?.id])

  const fetchVideos = async () => {
    try {
      const res = await fetch('/api/dashboard/videos')
      if (res.ok) {
        const data = await res.json()
        setVideos(data.videos || [])
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async (videoId: string) => {
    setActionLoading(videoId)
    try {
      const res = await fetch(`/api/videos/${videoId}/publish`, {
        method: 'POST',
      })

      if (res.ok) {
        // Update local state
        setVideos(videos.map(v =>
          v.id === videoId
            ? { ...v, status: 'READY' as const, publishedAt: new Date().toISOString(), scheduledPublishAt: null }
            : v
        ))
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to publish')
      }
    } catch (error) {
      alert('Failed to publish video')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return

    setActionLoading(videoId)
    try {
      const res = await fetch(`/api/videos/${videoId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setVideos(videos.filter(v => v.id !== videoId))
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete')
      }
    } catch (error) {
      alert('Failed to delete video')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelSchedule = async (videoId: string) => {
    setActionLoading(videoId)
    try {
      const res = await fetch(`/api/videos/${videoId}/schedule`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setVideos(videos.map(v =>
          v.id === videoId
            ? { ...v, status: 'DRAFT' as const, scheduledPublishAt: null }
            : v
        ))
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to cancel schedule')
      }
    } catch (error) {
      alert('Failed to cancel schedule')
    } finally {
      setActionLoading(null)
    }
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const filteredVideos = videos.filter(video => {
    switch (activeTab) {
      case 'published':
        return video.status === 'READY'
      case 'drafts':
        return video.status === 'DRAFT'
      case 'scheduled':
        return video.status === 'SCHEDULED'
      default:
        return video.status !== 'DELETED'
    }
  })

  const counts = {
    all: videos.filter(v => v.status !== 'DELETED').length,
    published: videos.filter(v => v.status === 'READY').length,
    drafts: videos.filter(v => v.status === 'DRAFT').length,
    scheduled: videos.filter(v => v.status === 'SCHEDULED').length,
  }

  const getStatusBadge = (status: Video['status']) => {
    switch (status) {
      case 'READY':
        return <span className="px-2 py-0.5 text-xs bg-green-900/50 text-green-400 rounded">Published</span>
      case 'DRAFT':
        return <span className="px-2 py-0.5 text-xs bg-gray-700 text-gray-300 rounded">Draft</span>
      case 'SCHEDULED':
        return <span className="px-2 py-0.5 text-xs bg-blue-900/50 text-blue-400 rounded">Scheduled</span>
      case 'PROCESSING':
        return <span className="px-2 py-0.5 text-xs bg-yellow-900/50 text-yellow-400 rounded">Processing</span>
      case 'FAILED':
        return <span className="px-2 py-0.5 text-xs bg-red-900/50 text-red-400 rounded">Failed</span>
      default:
        return null
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen p-6 max-w-6xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-800 rounded w-48 mb-6" />
          <div className="h-12 bg-gray-800 rounded mb-6" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-800 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Your Videos</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage your uploads, drafts, and scheduled videos
          </p>
        </div>
        <Link
          href="/upload"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Upload
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 p-1 rounded-lg mb-6">
        {(['all', 'published', 'drafts', 'scheduled'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span className="ml-2 text-xs text-gray-500">({counts[tab]})</span>
          </button>
        ))}
      </div>

      {/* Videos List */}
      {filteredVideos.length === 0 ? (
        <div className="text-center py-16 bg-gray-900 rounded-lg">
          <svg className="w-16 h-16 mx-auto text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-medium text-white mb-2">
            {activeTab === 'all' ? 'No videos yet' : `No ${activeTab} videos`}
          </h3>
          <p className="text-gray-400 mb-4">
            {activeTab === 'drafts'
              ? 'Videos saved as drafts will appear here'
              : activeTab === 'scheduled'
                ? 'Scheduled videos will appear here'
                : 'Upload your first video to get started'}
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload Video
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredVideos.map((video) => (
            <div
              key={video.id}
              className="bg-gray-900 rounded-lg p-4 flex gap-4 hover:bg-gray-800/50 transition-colors"
            >
              {/* Thumbnail */}
              <Link href={video.status === 'READY' ? `/watch/${video.id}` : '#'} className="flex-shrink-0">
                <div className="relative w-40 aspect-video bg-gray-800 rounded-lg overflow-hidden">
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/80 text-white text-xs rounded">
                    {formatDuration(video.duration)}
                  </div>
                </div>
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-white font-medium truncate">{video.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(video.status)}
                      {video.game && (
                        <span className="text-xs text-gray-500">{video.game.name}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats and dates */}
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  {video.status === 'READY' && (
                    <>
                      <span>{video.viewCount.toLocaleString()} views</span>
                      <span>{video.likeCount} likes</span>
                      <span>{video.commentCount} comments</span>
                    </>
                  )}
                  {video.status === 'SCHEDULED' && video.scheduledPublishAt && (
                    <span className="text-blue-400">
                      Publishes: {formatDateTime(video.scheduledPublishAt)}
                    </span>
                  )}
                  <span>Uploaded: {formatDate(video.createdAt)}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3">
                  {video.status === 'READY' && (
                    <Link
                      href={`/watch/${video.id}`}
                      className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                    >
                      View
                    </Link>
                  )}
                  {(video.status === 'DRAFT' || video.status === 'SCHEDULED') && (
                    <button
                      onClick={() => handlePublish(video.id)}
                      disabled={actionLoading === video.id}
                      className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded transition-colors"
                    >
                      {actionLoading === video.id ? 'Publishing...' : 'Publish Now'}
                    </button>
                  )}
                  {video.status === 'SCHEDULED' && (
                    <button
                      onClick={() => handleCancelSchedule(video.id)}
                      disabled={actionLoading === video.id}
                      className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                    >
                      Cancel Schedule
                    </button>
                  )}
                  <Link
                    href={`/videos/${video.id}/edit`}
                    className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(video.id)}
                    disabled={actionLoading === video.id}
                    className="px-3 py-1.5 text-xs bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
