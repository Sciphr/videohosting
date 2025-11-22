'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Stream {
  id: string
  title: string
  description: string | null
  status: 'OFFLINE' | 'LIVE' | 'ENDED'
  thumbnailUrl: string | null
  viewerCount: number
  startedAt: string | null
  user: {
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
  }
  game: {
    id: string
    name: string
    slug: string
    coverImageUrl: string | null
  } | null
}

interface Game {
  id: string
  name: string
  slug: string
  coverImageUrl: string | null
  _count?: {
    streams: number
  }
}

export default function StreamsPage() {
  const [streams, setStreams] = useState<Stream[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [games, setGames] = useState<Game[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch live streams
        const streamsUrl = selectedGame
          ? `/api/streams?status=LIVE&gameId=${selectedGame}`
          : '/api/streams?status=LIVE'

        const [streamsRes, gamesRes] = await Promise.all([
          fetch(streamsUrl),
          fetch('/api/games?hasLiveStreams=true')
        ])

        if (streamsRes.ok) {
          const data = await streamsRes.json()
          setStreams(data.streams || data)
        }

        if (gamesRes.ok) {
          const gamesData = await gamesRes.json()
          setGames(gamesData.games || gamesData || [])
        }
      } catch (err) {
        console.error('Failed to fetch streams:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [selectedGame])

  const getStreamDuration = (startedAt: string) => {
    const start = new Date(startedAt)
    const now = new Date()
    const diffMs = now.getTime() - start.getTime()
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  if (loading) {
    return (
      <div className="min-h-screen p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Live Streams</h1>
            <p className="text-gray-400 mt-1">Watch your favorite creators live</p>
          </div>
        </div>

        {/* Loading skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-video bg-gray-800 rounded-lg mb-3" />
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-gray-800 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-800 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-800 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Live Streams</h1>
          <p className="text-gray-400 mt-1">
            {streams.length} {streams.length === 1 ? 'stream' : 'streams'} live now
          </p>
        </div>
        <Link
          href="/go-live"
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Go Live
        </Link>
      </div>

      {/* Game Filter */}
      {games.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedGame(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedGame === null
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              All
            </button>
            {games.map((game) => (
              <button
                key={game.id}
                onClick={() => setSelectedGame(game.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedGame === game.id
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {game.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Streams Grid */}
      {streams.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-800 flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">No Live Streams</h2>
          <p className="text-gray-400 mb-6">
            {selectedGame
              ? 'No one is streaming this game right now'
              : 'No one is currently streaming. Be the first!'}
          </p>
          <Link
            href="/go-live"
            className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Start Streaming
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {streams.map((stream) => (
            <Link
              key={stream.id}
              href={`/live/${stream.user.username}`}
              className="group"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden mb-3">
                {stream.thumbnailUrl ? (
                  <img
                    src={stream.thumbnailUrl}
                    alt={stream.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-600/30 to-purple-600/30">
                    <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                {/* Live Badge */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 bg-red-600 text-white text-xs font-medium rounded flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    LIVE
                  </span>
                </div>

                {/* Viewer Count */}
                <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/70 text-white text-xs rounded">
                  {stream.viewerCount.toLocaleString()} viewers
                </div>

                {/* Duration */}
                {stream.startedAt && (
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 text-white text-xs rounded">
                    {getStreamDuration(stream.startedAt)}
                  </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-violet-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Stream Info */}
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                  {stream.user.avatarUrl ? (
                    <img src={stream.user.avatarUrl} alt={stream.user.username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium">
                      {(stream.user.displayName || stream.user.username)[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white truncate group-hover:text-violet-400 transition-colors">
                    {stream.title}
                  </h3>
                  <p className="text-sm text-gray-400 truncate">
                    {stream.user.displayName || stream.user.username}
                  </p>
                  {stream.game && (
                    <p className="text-sm text-gray-500 truncate">
                      {stream.game.name}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
