'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navigation from '@/components/Navigation'

interface Tag {
  id: string
  name: string
  slug: string
  type: 'GAME' | 'EMOTION' | 'CUSTOM'
  color: string | null
  icon: string | null
  videoCount: number
}

const tagTypeColors: Record<string, string> = {
  GAME: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  EMOTION: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  CUSTOM: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
}

const tagTypeLabels: Record<string, string> = {
  GAME: 'Games',
  EMOTION: 'Moments',
  CUSTOM: 'Tags',
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchTags()
  }, [activeType])

  const fetchTags = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (activeType) params.set('type', activeType)

      const res = await fetch(`/api/tags?${params}`)
      if (res.ok) {
        const data = await res.json()
        setTags(data.tags || [])
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Group tags by type
  const groupedTags = filteredTags.reduce((acc, tag) => {
    if (!acc[tag.type]) acc[tag.type] = []
    acc[tag.type].push(tag)
    return acc
  }, {} as Record<string, Tag[]>)

  return (
    <div className="min-h-screen bg-gray-950">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Browse by Tags</h1>
          <p className="text-gray-400">Discover videos by games, moments, and more</p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tags..."
              className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Type filters */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveType(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeType === null
                  ? 'bg-white text-black'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              All
            </button>
            {['GAME', 'EMOTION', 'CUSTOM'].map((type) => (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeType === type
                    ? 'bg-white text-black'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {tagTypeLabels[type]}
              </button>
            ))}
          </div>
        </div>

        {/* Tags Display */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : filteredTags.length === 0 ? (
          <div className="text-center py-16 bg-gray-900 rounded-xl">
            <svg className="w-16 h-16 text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <h2 className="text-xl font-semibold text-white mb-2">No tags found</h2>
            <p className="text-gray-400">
              {searchQuery ? 'Try a different search term' : 'Tags will appear here as videos are uploaded'}
            </p>
          </div>
        ) : activeType ? (
          // Single type view - grid of tags
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredTags.map((tag) => (
              <Link
                key={tag.id}
                href={`/tags/${tag.slug}`}
                className={`p-4 rounded-xl border ${tagTypeColors[tag.type]} hover:scale-105 transition-all`}
              >
                <h3 className="font-semibold truncate">{tag.name}</h3>
                <p className="text-sm opacity-70 mt-1">
                  {tag.videoCount} video{tag.videoCount !== 1 ? 's' : ''}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          // All types view - grouped sections
          <div className="space-y-10">
            {Object.entries(groupedTags).map(([type, typeTags]) => (
              <section key={type}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {tagTypeLabels[type]}
                    <span className="text-sm font-normal text-gray-500">
                      ({typeTags.length})
                    </span>
                  </h2>
                  <button
                    onClick={() => setActiveType(type)}
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    View all
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {typeTags.slice(0, 12).map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/tags/${tag.slug}`}
                      className={`p-3 rounded-lg border ${tagTypeColors[tag.type]} hover:scale-105 transition-all`}
                    >
                      <h3 className="font-medium text-sm truncate">{tag.name}</h3>
                      <p className="text-xs opacity-70 mt-0.5">
                        {tag.videoCount} video{tag.videoCount !== 1 ? 's' : ''}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
