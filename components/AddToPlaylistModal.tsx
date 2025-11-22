'use client'

import { useState, useEffect } from 'react'

interface Playlist {
  id: string
  name: string
  videoCount: number
  isPublic: boolean
  videos: Array<{ videoId: string }>
}

interface AddToPlaylistModalProps {
  videoId: string
  isOpen: boolean
  onClose: () => void
}

export default function AddToPlaylistModal({ videoId, isOpen, onClose }: AddToPlaylistModalProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [addingTo, setAddingTo] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchPlaylists()
    }
  }, [isOpen])

  const fetchPlaylists = async () => {
    try {
      setLoading(true)
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
        body: JSON.stringify({ name: newPlaylistName.trim() }),
      })

      if (res.ok) {
        const playlist = await res.json()
        setPlaylists([playlist, ...playlists])
        setNewPlaylistName('')
        setShowCreateForm(false)
        // Automatically add video to new playlist
        await addToPlaylist(playlist.id)
      }
    } catch (error) {
      console.error('Failed to create playlist:', error)
    } finally {
      setCreating(false)
    }
  }

  const addToPlaylist = async (playlistId: string) => {
    try {
      setAddingTo(playlistId)
      const res = await fetch(`/api/playlists/${playlistId}/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId }),
      })

      if (res.ok) {
        // Update local state
        setPlaylists(playlists.map(p =>
          p.id === playlistId
            ? { ...p, videoCount: p.videoCount + 1, videos: [...p.videos, { videoId }] }
            : p
        ))
      } else {
        const error = await res.json()
        if (error.error === 'Video already in playlist') {
          // Remove from playlist instead
          await removeFromPlaylist(playlistId)
        }
      }
    } catch (error) {
      console.error('Failed to add to playlist:', error)
    } finally {
      setAddingTo(null)
    }
  }

  const removeFromPlaylist = async (playlistId: string) => {
    try {
      setAddingTo(playlistId)
      const res = await fetch(`/api/playlists/${playlistId}/videos?videoId=${videoId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setPlaylists(playlists.map(p =>
          p.id === playlistId
            ? { ...p, videoCount: p.videoCount - 1, videos: p.videos.filter(v => v.videoId !== videoId) }
            : p
        ))
      }
    } catch (error) {
      console.error('Failed to remove from playlist:', error)
    } finally {
      setAddingTo(null)
    }
  }

  const isInPlaylist = (playlist: Playlist) => {
    return playlist.videos?.some(v => v.videoId === videoId)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-gray-900 rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Save to playlist</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded-lg transition-colors">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {playlists.length === 0 && !showCreateForm ? (
                <p className="text-gray-400 text-center py-4">No playlists yet</p>
              ) : (
                playlists.map(playlist => {
                  const inPlaylist = isInPlaylist(playlist)
                  return (
                    <button
                      key={playlist.id}
                      onClick={() => inPlaylist ? removeFromPlaylist(playlist.id) : addToPlaylist(playlist.id)}
                      disabled={addingTo === playlist.id}
                      className="w-full flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-750 rounded-lg transition-colors text-left group"
                    >
                      {/* Checkbox */}
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        inPlaylist ? 'bg-blue-600 border-blue-600' : 'border-gray-600 group-hover:border-gray-500'
                      }`}>
                        {inPlaylist && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {addingTo === playlist.id && (
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>

                      {/* Playlist info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{playlist.name}</p>
                        <p className="text-sm text-gray-400">
                          {playlist.videoCount} video{playlist.videoCount !== 1 ? 's' : ''}
                          {!playlist.isPublic && (
                            <span className="ml-2 text-gray-500">
                              <svg className="w-3 h-3 inline-block" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                              </svg>
                              Private
                            </span>
                          )}
                        </p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>

        {/* Create new playlist */}
        <div className="p-4 border-t border-gray-800">
          {showCreateForm ? (
            <div className="space-y-3">
              <input
                type="text"
                value={newPlaylistName}
                onChange={e => setNewPlaylistName(e.target.value)}
                placeholder="Playlist name"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && createPlaylist()}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreateForm(false)}
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
          ) : (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create new playlist
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
