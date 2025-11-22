'use client'

import { useState, useEffect } from 'react'

interface Chapter {
  id: string
  title: string
  timestamp: number
  thumbnailUrl?: string | null
}

interface ChapterListProps {
  videoId: string
  currentTime?: number
  onChapterClick?: (timestamp: number) => void
  chapters?: Chapter[]
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function ChapterList({ videoId, currentTime = 0, onChapterClick, chapters: externalChapters }: ChapterListProps) {
  const [chapters, setChapters] = useState<Chapter[]>(externalChapters || [])
  const [loading, setLoading] = useState(!externalChapters)
  const [isExpanded, setIsExpanded] = useState(true)

  useEffect(() => {
    if (externalChapters) {
      setChapters(externalChapters)
      return
    }

    const fetchChapters = async () => {
      try {
        const res = await fetch(`/api/videos/${videoId}/chapters`)
        if (res.ok) {
          const data = await res.json()
          setChapters(data)
        }
      } catch (err) {
        console.error('Failed to fetch chapters:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchChapters()
  }, [videoId, externalChapters])

  // Find the current chapter based on currentTime
  const currentChapterIndex = chapters.reduce((acc, chapter, index) => {
    if (chapter.timestamp <= currentTime) return index
    return acc
  }, -1)

  if (loading) {
    return (
      <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-gray-800 rounded w-24"></div>
          <div className="h-10 bg-gray-800 rounded"></div>
          <div className="h-10 bg-gray-800 rounded"></div>
        </div>
      </div>
    )
  }

  if (chapters.length === 0) {
    return null
  }

  return (
    <div className="bg-gray-900/50 rounded-lg border border-gray-800 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="font-semibold text-white">Chapters</span>
          <span className="text-sm text-gray-500">({chapters.length})</span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-800 max-h-80 overflow-y-auto">
          {chapters.map((chapter, index) => {
            const isCurrentChapter = index === currentChapterIndex
            const isPastChapter = index < currentChapterIndex

            return (
              <button
                key={chapter.id}
                onClick={() => onChapterClick?.(chapter.timestamp)}
                className={`w-full p-3 flex items-center gap-3 text-left transition-colors ${
                  isCurrentChapter
                    ? 'bg-violet-600/20 border-l-2 border-violet-500'
                    : 'hover:bg-gray-800/50 border-l-2 border-transparent'
                }`}
              >
                <span className={`font-mono text-sm px-2 py-0.5 rounded ${
                  isCurrentChapter
                    ? 'bg-violet-500/30 text-violet-300'
                    : isPastChapter
                      ? 'bg-gray-700 text-gray-400'
                      : 'bg-gray-800 text-gray-400'
                }`}>
                  {formatTime(chapter.timestamp)}
                </span>
                <span className={`flex-1 text-sm ${
                  isCurrentChapter
                    ? 'text-violet-200 font-medium'
                    : isPastChapter
                      ? 'text-gray-400'
                      : 'text-gray-200'
                }`}>
                  {chapter.title}
                </span>
                {isCurrentChapter && (
                  <span className="text-xs text-violet-400 bg-violet-500/20 px-2 py-0.5 rounded">
                    Now
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
