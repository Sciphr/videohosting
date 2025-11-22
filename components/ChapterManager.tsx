'use client'

import { useState, useEffect } from 'react'
import Player from 'video.js/dist/types/player'

interface Chapter {
  id: string
  title: string
  timestamp: number
  thumbnailUrl?: string | null
  position: number
}

interface ChapterManagerProps {
  videoId: string
  videoDuration?: number | null
  player?: Player | null
  onChaptersChange?: (chapters: Chapter[]) => void
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function parseTime(timeStr: string): number | null {
  const parts = timeStr.split(':').map(p => parseInt(p, 10))
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return parts[0] * 60 + parts[1]
  }
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  }
  const num = parseFloat(timeStr)
  return isNaN(num) ? null : num
}

export default function ChapterManager({ videoId, videoDuration, player, onChaptersChange }: ChapterManagerProps) {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editTime, setEditTime] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newTime, setNewTime] = useState('')

  useEffect(() => {
    fetchChapters()
  }, [videoId])

  const fetchChapters = async () => {
    try {
      const res = await fetch(`/api/videos/${videoId}/chapters`)
      if (res.ok) {
        const data = await res.json()
        setChapters(data)
        onChaptersChange?.(data)
      }
    } catch (err) {
      console.error('Failed to fetch chapters:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddChapter = async () => {
    const timestamp = parseTime(newTime)
    if (!newTitle.trim()) {
      setError('Title is required')
      return
    }
    if (timestamp === null || timestamp < 0) {
      setError('Invalid timestamp format (use mm:ss)')
      return
    }
    if (videoDuration && timestamp > videoDuration) {
      setError('Timestamp exceeds video duration')
      return
    }

    setError(null)
    setSaving(true)

    try {
      const res = await fetch(`/api/videos/${videoId}/chapters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim(), timestamp }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add chapter')
      }

      const chapter = await res.json()
      const updated = [...chapters, chapter].sort((a, b) => a.timestamp - b.timestamp)
      setChapters(updated)
      onChaptersChange?.(updated)
      setNewTitle('')
      setNewTime('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add chapter')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateChapter = async (chapterId: string) => {
    const timestamp = parseTime(editTime)
    if (!editTitle.trim()) {
      setError('Title is required')
      return
    }
    if (timestamp === null || timestamp < 0) {
      setError('Invalid timestamp format (use mm:ss)')
      return
    }

    setError(null)
    setSaving(true)

    try {
      const res = await fetch(`/api/videos/${videoId}/chapters/${chapterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle.trim(), timestamp }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update chapter')
      }

      const updatedChapter = await res.json()
      const updated = chapters.map(c => c.id === chapterId ? updatedChapter : c)
        .sort((a, b) => a.timestamp - b.timestamp)
      setChapters(updated)
      onChaptersChange?.(updated)
      setEditingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update chapter')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm('Are you sure you want to delete this chapter?')) return

    try {
      const res = await fetch(`/api/videos/${videoId}/chapters/${chapterId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Failed to delete chapter')
      }

      const updated = chapters.filter(c => c.id !== chapterId)
      setChapters(updated)
      onChaptersChange?.(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete chapter')
    }
  }

  const startEditing = (chapter: Chapter) => {
    setEditingId(chapter.id)
    setEditTitle(chapter.title)
    setEditTime(formatTime(chapter.timestamp))
    setError(null)
  }

  const handleUseCurrentTime = () => {
    if (player) {
      const currentTime = player.currentTime() || 0
      setNewTime(formatTime(currentTime))
    }
  }

  const handleUseCurrentTimeForEdit = () => {
    if (player) {
      const currentTime = player.currentTime() || 0
      setEditTime(formatTime(currentTime))
    }
  }

  const handleSeekToChapter = (timestamp: number) => {
    if (player) {
      player.currentTime(timestamp)
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <div className="animate-pulse flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-700 rounded-full"></div>
          <div className="h-4 bg-gray-700 rounded w-32"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800">
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          Video Chapters
        </h3>
        <p className="text-sm text-gray-400 mt-1">Add chapters to help viewers navigate your video</p>
      </div>

      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Add new chapter */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Chapter title"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>
          <div className="w-28 relative">
            <input
              type="text"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              placeholder="mm:ss"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>
          {player && (
            <button
              onClick={handleUseCurrentTime}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
              title="Use current video time"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
          <button
            onClick={handleAddChapter}
            disabled={saving || !newTitle.trim()}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )}
            Add
          </button>
        </div>
      </div>

      {/* Chapter list */}
      <div className="divide-y divide-gray-800">
        {chapters.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <p>No chapters yet</p>
            <p className="text-sm mt-1">Add chapters to help viewers navigate</p>
          </div>
        ) : (
          chapters.map((chapter, index) => (
            <div key={chapter.id} className="p-4 hover:bg-gray-800/50 transition-colors">
              {editingId === chapter.id ? (
                <div className="flex gap-3 items-center">
                  <span className="text-gray-500 text-sm w-6">{index + 1}.</span>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <div className="w-24 relative">
                    <input
                      type="text"
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  {player && (
                    <button
                      onClick={handleUseCurrentTimeForEdit}
                      className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                      title="Use current video time"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => handleUpdateChapter(chapter.id)}
                    disabled={saving}
                    className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 text-sm w-6">{index + 1}.</span>
                  <button
                    onClick={() => handleSeekToChapter(chapter.timestamp)}
                    className="text-violet-400 hover:text-violet-300 font-mono text-sm bg-violet-500/10 px-2 py-1 rounded transition-colors"
                  >
                    {formatTime(chapter.timestamp)}
                  </button>
                  <span className="flex-1 text-white">{chapter.title}</span>
                  <button
                    onClick={() => startEditing(chapter)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteChapter(chapter.id)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
