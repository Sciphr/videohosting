'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import VideoCard from '@/components/VideoCard'

interface Tag {
  id: string
  name: string
  slug: string
  type: 'GAME' | 'EMOTION' | 'CUSTOM'
  color: string | null
}

interface Video {
  id: string
  title: string
  description: string | null
  thumbnailUrl: string | null
  duration: number | null
  viewCount: number
  likeCount: number
  commentCount: number
  videoType: 'CLIP' | 'FULL'
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

const tagTypeLabels: Record<string, string> = {
  GAME: 'Game',
  EMOTION: 'Moment',
  CUSTOM: 'Tag',
}

const tagTypeColors: Record<string, string> = {
  GAME: 'text-purple-400',
  EMOTION: 'text-yellow-400',
  CUSTOM: 'text-blue-400',
}

export default function TagDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params)
  const [tag, setTag] = useState<Tag | null>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchTagVideos()
  }, [resolvedParams.slug, page])

  const fetchTagVideos = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/tags/${resolvedParams.slug}?page=${page}&limit=20`)
      if (res.ok) {
        const data = await res.json()
        setTag(data.tag)
        setVideos(data.videos)
        setTotalPages(data.pagination.totalPages)
        setTotal(data.pagination.total)
      }
    } catch (error) {
      console.error('Failed to fetch tag videos:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !tag) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navigation />
        <div className="flex items-center justify-center py-16">
          <div className="w-12 h-12 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!tag) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navigation />
        <div className="text-center py-16">
          <p className="text-gray-400">Tag not found</p>
          <Link href="/tags" className="text-blue-400 hover:underline mt-2 inline-block">
            Browse all tags
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm mb-2">
            <Link href="/tags" className="text-gray-400 hover:text-white transition-colors">
              Tags
            </Link>
            <span className="text-gray-600">/</span>
            <span className={tagTypeColors[tag.type]}>{tagTypeLabels[tag.type]}</span>
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">{tag.name}</h1>
          <p className="text-gray-400">
            {total} video{total !== 1 ? 's' : ''} with this tag
          </p>
        </div>

        {/* Videos Grid */}
        {videos.length === 0 ? (
          <div className="text-center py-16 bg-gray-900 rounded-xl">
            <svg className="w-16 h-16 text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <h2 className="text-xl font-semibold text-white mb-2">No videos yet</h2>
            <p className="text-gray-400">Be the first to upload a video with this tag</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (page <= 3) {
                      pageNum = i + 1
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = page - 2 + i
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                          page === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
