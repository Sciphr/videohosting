'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ActiveParty {
  id: string
  roomCode: string
  video: {
    id: string
    title: string
    thumbnailUrl: string | null
  }
  host: {
    id: string
    username: string
    displayName: string | null
  }
  participantCount: number
  startedAt: Date
}

export default function ActiveWatchPartiesPage() {
  const router = useRouter()
  const [parties, setParties] = useState<ActiveParty[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => {
    fetchActiveParties()
    // Refresh every 10 seconds
    const interval = setInterval(fetchActiveParties, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchActiveParties = async () => {
    try {
      const res = await fetch('/api/watch-party/active')
      if (!res.ok) {
        throw new Error('Failed to fetch active parties')
      }
      const data = await res.json()
      setParties(data.parties)
      setError('')
    } catch (err) {
      console.error('Error fetching active parties:', err)
      setError('Failed to load active watch parties')
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinParty = (roomCode: string) => {
    router.push(`/party/${roomCode}`)
  }

  const handleCopyCode = (e: React.MouseEvent, roomCode: string) => {
    e.stopPropagation()
    navigator.clipboard.writeText(roomCode)
    setCopiedCode(roomCode)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-400">Loading active watch parties...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-500/50 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Active Watch Parties</h1>
            <p className="text-gray-300">
              Join your friends and watch videos together in real-time
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-400">{parties.length}</div>
            <div className="text-sm text-gray-400">Active Parties</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 mb-6 text-red-200">
          {error}
        </div>
      )}

      {/* Parties Grid */}
      {parties.length === 0 ? (
        <div className="text-center py-16">
          <svg className="mx-auto h-16 w-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-xl font-medium text-white mb-2">No Active Watch Parties</h3>
          <p className="text-gray-400 mb-6">Be the first to start one!</p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Browse Videos
            </Link>
            <Link
              href="/party/join"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              Join with Code
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {parties.map((party) => (
            <div
              key={party.id}
              className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-purple-500 transition-all"
            >
              {/* Video Thumbnail */}
              <div className="relative aspect-video bg-gray-800">
                {party.video.thumbnailUrl ? (
                  <img
                    src={party.video.thumbnailUrl}
                    alt={party.video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600">
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    </svg>
                  </div>
                )}
                {/* Live Badge */}
                <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  LIVE
                </div>
              </div>

              {/* Party Info */}
              <div className="p-4">
                <h3 className="text-white font-semibold line-clamp-2 mb-2">
                  {party.video.title}
                </h3>

                <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Hosted by {party.host.displayName || party.host.username}</span>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-purple-400 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="font-semibold">{party.participantCount} watching</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-mono">
                      {party.roomCode}
                    </span>
                    <button
                      onClick={(e) => handleCopyCode(e, party.roomCode)}
                      className="p-1 hover:bg-gray-800 rounded transition-colors group"
                      title="Copy room code"
                    >
                      {copiedCode === party.roomCode ? (
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-gray-500 group-hover:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => handleJoinParty(party.roomCode)}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Join Party
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Help Text */}
      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>Updates automatically every 10 seconds</p>
      </div>
    </div>
  )
}
