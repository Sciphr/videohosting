'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navigation from '@/components/Navigation'

interface Video {
  id: string
  title: string
  description: string | null
  thumbnailUrl: string | null
  duration: number | null
  viewCount: number
  createdAt: string
  uploader: {
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
  }
  game: {
    id: string
    name: string
    slug: string
  } | null
}

interface PlaylistVideo {
  id: string
  position: number
  addedAt: string
  video: Video
}

interface Playlist {
  id: string
  name: string
  description: string | null
  videoCount: number
  isPublic: boolean
  thumbnailUrl: string | null
  createdAt: string
  updatedAt: string
  user: {
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
  }
  videos: PlaylistVideo[]
}

export default function PlaylistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPublic, setEditPublic] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    fetchPlaylist()
    fetchCurrentUser()
  }, [resolvedParams.id])

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/user')
      if (res.ok) {
        const user = await res.json()
        setCurrentUserId(user.id)
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error)
    }
  }

  const fetchPlaylist = async () => {
    try {
      const res = await fetch(`/api/playlists/${resolvedParams.id}`)
      if (res.ok) {
        const data = await res.json()
        setPlaylist(data)
        setEditName(data.name)
        setEditDescription(data.description || '')
        setEditPublic(data.isPublic)
      } else if (res.status === 404) {
        router.push('/playlists')
      }
    } catch (error) {
      console.error('Failed to fetch playlist:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveChanges = async () => {
    if (!editName.trim()) return

    try {
      setSaving(true)
      const res = await fetch(`/api/playlists/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim() || null,
          isPublic: editPublic,
        }),
      })

      if (res.ok) {
        const updated = await res.json()
        setPlaylist(prev => prev ? { ...prev, ...updated } : null)
        setEditing(false)
      }
    } catch (error) {
      console.error('Failed to update playlist:', error)
    } finally {
      setSaving(false)
    }
  }

  const removeVideo = async (videoId: string) => {
    try {
      const res = await fetch(`/api/playlists/${resolvedParams.id}/videos?videoId=${videoId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setPlaylist(prev => prev ? {
          ...prev,
          videoCount: prev.videoCount - 1,
          videos: prev.videos.filter(v => v.video.id !== videoId),
        } : null)
      }
    } catch (error) {
      console.error('Failed to remove video:', error)
    }
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00'
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatViews = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  const isOwner = currentUserId && playlist?.user.id === currentUserId

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navigation />
        <div className="flex items-center justify-center py-16">
          <div className="w-12 h-12 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!playlist) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navigation />
        <div className="text-center py-16">
          <p className="text-gray-400">Playlist not found</p>
        </div>
      </div>
    )
  }

  const totalDuration = playlist.videos.reduce((sum, pv) => sum + (pv.video.duration || 0), 0)

  return (
    <div className="min-h-screen bg-gray-950">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Playlist Info Sidebar */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-gradient-to-b from-blue-900/30 to-gray-900 rounded-xl p-6 sticky top-4">
              {/* Thumbnail */}
              <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden mb-4">
                {playlist.videos[0]?.video.thumbnailUrl ? (
                  <img
                    src={playlist.videos[0].video.thumbnailUrl}
                    alt={playlist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-16 h-16 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Playlist Details */}
              {editing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                  <textarea
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    placeholder="Description"
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editPublic}
                      onChange={e => setEditPublic(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-300">Public playlist</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing(false)}
                      className="flex-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveChanges}
                      disabled={saving}
                      className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-xl font-bold text-white mb-2">{playlist.name}</h1>
                  {playlist.description && (
                    <p className="text-gray-400 text-sm mb-4">{playlist.description}</p>
                  )}

                  <Link
                    href={`/profile/${playlist.user.username}`}
                    className="flex items-center gap-2 mb-4 hover:bg-gray-800/50 p-2 -mx-2 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                      {playlist.user.displayName?.[0] || playlist.user.username[0]}
                    </div>
                    <span className="text-white text-sm">{playlist.user.displayName || playlist.user.username}</span>
                  </Link>

                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                    <span>{playlist.videoCount} videos</span>
                    <span>{formatDuration(totalDuration)} total</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                    {!playlist.isPublic && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                        </svg>
                        Private
                      </span>
                    )}
                    <span>Updated {new Date(playlist.updatedAt).toLocaleDateString()}</span>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    {playlist.videos.length > 0 && (
                      <Link
                        href={`/watch/${playlist.videos[0].video.id}?playlist=${playlist.id}`}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        Play all
                      </Link>
                    )}
                    {isOwner && (
                      <button
                        onClick={() => setEditing(true)}
                        className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors"
                      >
                        Edit playlist
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Videos List */}
          <div className="flex-1">
            {playlist.videos.length === 0 ? (
              <div className="text-center py-16 bg-gray-900 rounded-xl">
                <svg className="w-16 h-16 text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <h2 className="text-xl font-semibold text-white mb-2">No videos in this playlist</h2>
                <p className="text-gray-400">Add videos to start building your playlist</p>
              </div>
            ) : (
              <div className="space-y-2">
                {playlist.videos.map((pv, index) => (
                  <div
                    key={pv.id}
                    className="flex gap-4 p-3 bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors group"
                  >
                    {/* Index */}
                    <div className="w-8 flex items-center justify-center text-gray-500 text-sm">
                      {index + 1}
                    </div>

                    {/* Thumbnail */}
                    <Link href={`/watch/${pv.video.id}`} className="relative flex-shrink-0">
                      <div className="w-40 aspect-video bg-gray-800 rounded-lg overflow-hidden">
                        {pv.video.thumbnailUrl ? (
                          <img
                            src={pv.video.thumbnailUrl}
                            alt={pv.video.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-xs text-white">
                        {formatDuration(pv.video.duration)}
                      </div>
                    </Link>

                    {/* Video Info */}
                    <div className="flex-1 min-w-0">
                      <Link href={`/watch/${pv.video.id}`}>
                        <h3 className="text-white font-medium line-clamp-2 group-hover:text-blue-400 transition-colors">
                          {pv.video.title}
                        </h3>
                      </Link>
                      <Link
                        href={`/profile/${pv.video.uploader.username}`}
                        className="text-sm text-gray-400 hover:text-gray-300 mt-1 block"
                      >
                        {pv.video.uploader.displayName || pv.video.uploader.username}
                      </Link>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatViews(pv.video.viewCount)} views
                      </p>
                    </div>

                    {/* Remove button */}
                    {isOwner && (
                      <button
                        onClick={() => removeVideo(pv.video.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-400 transition-all"
                        title="Remove from playlist"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
