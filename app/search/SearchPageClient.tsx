'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import VideoCard from '@/components/VideoCard'

interface SearchResults {
  videos?: any[]
  users?: any[]
  games?: any[]
}

export default function SearchPageClient() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q')
  const [results, setResults] = useState<SearchResults>({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'videos' | 'users' | 'games'>('all')

  useEffect(() => {
    if (query) {
      fetchResults(query)
    }
  }, [query])

  const fetchResults = async (searchQuery: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=${activeTab === 'all' ? '' : activeTab}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (query) {
      fetchResults(query)
    }
  }, [activeTab])

  if (!query) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Enter a search query to see results</p>
      </div>
    )
  }

  const hasResults = (results.videos && results.videos.length > 0) ||
                     (results.users && results.users.length > 0) ||
                     (results.games && results.games.length > 0)

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">
        Search results for "{query}"
      </h1>

      {/* Tabs */}
      <div className="border-b border-gray-800 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['all', 'videos', 'users', 'games'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-400">Searching...</p>
        </div>
      ) : !hasResults ? (
        <div className="text-center py-12">
          <p className="text-gray-400">No results found for "{query}"</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Videos */}
          {results.videos && results.videos.length > 0 && (activeTab === 'all' || activeTab === 'videos') && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Videos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.videos.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            </div>
          )}

          {/* Users */}
          {results.users && results.users.length > 0 && (activeTab === 'all' || activeTab === 'users') && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Users</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.users.map((user: any) => (
                  <Link key={user.id} href={`/profile/${user.id}`}>
                    <div className="bg-gray-900 rounded-lg p-4 hover:ring-2 hover:ring-blue-500 transition-all">
                      <div className="flex items-center gap-3">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.username} className="w-12 h-12 rounded-full" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <h3 className="text-white font-medium">{user.displayName || user.username}</h3>
                          <p className="text-gray-400 text-sm">@{user.username}</p>
                        </div>
                      </div>
                      {user.bio && (
                        <p className="text-gray-400 text-sm mt-2 line-clamp-2">{user.bio}</p>
                      )}
                      <div className="flex gap-4 mt-3 text-sm text-gray-500">
                        <span>{user._count.videos} videos</span>
                        <span>{user._count.followers} followers</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Games */}
          {results.games && results.games.length > 0 && (activeTab === 'all' || activeTab === 'games') && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Games</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.games.map((game: any) => (
                  <div key={game.id} className="bg-gray-900 rounded-lg p-4">
                    <h3 className="text-white font-medium text-lg">{game.name}</h3>
                    <p className="text-gray-400 text-sm mt-1">{game._count.videos} videos</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
