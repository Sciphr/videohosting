'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navigation from '@/components/Navigation'

interface Playlist {
  id: string
  name: string
  description: string | null
  videoCount: number
  isPublic: boolean
  thumbnailUrl: string | null
  createdAt: string
  user: {
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
  }
  videos: Array<{
    video: {
      id: string
      title: string
      thumbnailUrl: string | null
      duration: number | null
    }
  }>
}

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchPlaylists()
  }, [])

  const fetchPlaylists = async () => {
    try {
      const res = await fetch('/api/playlists?includePrivate=true')
      if (res.ok) {
        const data = await res.json()
        setPlaylists(data.playlists || [])
      }
    } catch (error) {
      console.error('Failed to fetch playlists:', error)
    } finally {
      setLoading(false)
    }
  }

  const createPlaylist = async () => {
    if (!newPlaylistName.trim()) return

    try {
      setCreating(true)
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPlaylistName.trim(),
          description: newPlaylistDescription.trim() || null,
          isPublic,
        }),
      })

      if (res.ok) {
        const playlist = await res.json()
        setPlaylists([{ ...playlist, videos: [], videoCount: 0 }, ...playlists])
        setShowCreateModal(false)
        setNewPlaylistName('')
        setNewPlaylistDescription('')
        setIsPublic(true)
      }
    } catch (error) {
      console.error('Failed to create playlist:', error)
    } finally {
      setCreating(false)
    }
  }

  const deletePlaylist = async (playlistId: string) => {
    if (!confirm('Are you sure you want to delete this playlist?')) return

    try {
      const res = await fetch(`/api/playlists/${playlistId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setPlaylists(playlists.filter(p => p.id !== playlistId))
      }
    } catch (error) {
      console.error('Failed to delete playlist:', error)
    }
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Your Playlists</h1>
            <p className="text-gray-400 mt-1">Organize and save your favorite videos</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Playlist
          </button>
        </div>

        {/* Playlists Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : playlists.length === 0 ? (
          <div className="text-center py-16 bg-gray-900 rounded-xl">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h2 className="text-xl font-semibold text-white mb-2">No playlists yet</h2>
            <p className="text-gray-400 mb-6">Create a playlist to start organizing your videos</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
            >
              Create your first playlist
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playlists.map(playlist => (
              <div
                key={playlist.id}
                className="bg-gray-900 rounded-xl overflow-hidden hover:ring-2 hover:ring-blue-500/50 transition-all group"
              >
                {/* Thumbnail Grid */}
                <Link href={`/playlists/${playlist.id}`}>
                  <div className="aspect-video bg-gray-800 relative">
                    {playlist.videos.length > 0 ? (
                      <div className="grid grid-cols-2 grid-rows-2 h-full">
                        {playlist.videos.slice(0, 4).map((pv, i) => (
                          <div key={pv.video.id} className={`relative ${playlist.videos.length === 1 ? 'col-span-2 row-span-2' : ''}`}>
                            {pv.video.thumbnailUrl ? (
                              <img
                                src={pv.video.thumbnailUrl}
                                alt={pv.video.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                        ))}
                        {/* Fill empty slots */}
                        {playlist.videos.length < 4 && playlist.videos.length > 1 &&
                          Array.from({ length: 4 - playlist.videos.length }).map((_, i) => (
                            <div key={`empty-${i}`} className="bg-gray-700" />
                          ))
                        }
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-16 h-16 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                    )}

                    {/* Overlay with video count */}
                    <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white font-medium">
                      {playlist.videoCount} video{playlist.videoCount !== 1 ? 's' : ''}
                    </div>

                    {/* Hover play button */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Playlist Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/playlists/${playlist.id}`} className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold truncate group-hover:text-blue-400 transition-colors">
                        {playlist.name}
                      </h3>
                      {playlist.description && (
                        <p className="text-gray-400 text-sm mt-1 line-clamp-2">{playlist.description}</p>
                      )}
                    </Link>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {!playlist.isPublic && (
                        <span className="p-1 text-gray-500" title="Private">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                          </svg>
                        </span>
                      )}
                      <button
                        onClick={() => deletePlaylist(playlist.id)}
                        className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                        title="Delete playlist"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mt-2">
                    Updated {new Date(playlist.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
          <div
            className="bg-gray-900 rounded-xl w-full max-w-md p-6"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-white mb-4">Create Playlist</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={e => setNewPlaylistName(e.target.value)}
                  placeholder="My awesome playlist"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Description (optional)</label>
                <textarea
                  value={newPlaylistDescription}
                  onChange={e => setNewPlaylistDescription(e.target.value)}
                  placeholder="What's this playlist about?"
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPublic(!isPublic)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${isPublic ? 'bg-blue-600' : 'bg-gray-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isPublic ? 'left-7' : 'left-1'}`} />
                </button>
                <span className="text-sm text-gray-300">
                  {isPublic ? 'Public' : 'Private'} - {isPublic ? 'Anyone can see this playlist' : 'Only you can see this playlist'}
                </span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createPlaylist}
                disabled={!newPlaylistName.trim() || creating}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white rounded-lg transition-colors"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
