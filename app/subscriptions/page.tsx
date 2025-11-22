'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import VideoCard from '@/components/VideoCard'

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

interface FollowedUser {
  id: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  videoCount: number
}

export default function SubscriptionsPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [followedUsers, setFollowedUsers] = useState<FollowedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [activeType, setActiveType] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(true)

  useEffect(() => {
    fetchFeed()
  }, [page, activeType])

  const fetchFeed = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('page', page.toString())
      if (activeType) params.set('type', activeType)

      const res = await fetch(`/api/feed/subscriptions?${params}`)
      if (res.status === 401) {
        setIsAuthenticated(false)
        return
      }

      if (res.ok) {
        const data = await res.json()
        setVideos(data.videos)
        setFollowedUsers(data.followedUsers)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Failed to fetch subscription feed:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter videos by selected user
  const displayedVideos = selectedUser
    ? videos.filter(v => v.uploader.id === selectedUser)
    : videos

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <svg className="w-20 h-20 text-gray-700 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <h1 className="text-2xl font-bold text-white mb-3">Sign in to see your subscriptions</h1>
          <p className="text-gray-400 mb-6">Follow your favorite creators to see their latest videos here</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
          >
            Sign In
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
          <h1 className="text-3xl font-bold text-white mb-2">Subscriptions</h1>
          <p className="text-gray-400">Latest videos from creators you follow</p>
        </div>

        {followedUsers.length === 0 && !loading ? (
          <div className="text-center py-16 bg-gray-900 rounded-xl">
            <svg className="w-20 h-20 text-gray-700 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-white mb-3">You haven't followed anyone yet</h2>
            <p className="text-gray-400 mb-6">When you follow creators, their latest videos will show up here</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
            >
              Discover Creators
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Followed Users Sidebar */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-gray-900 rounded-xl p-4 sticky top-4">
                <h2 className="font-semibold text-white mb-4">Following ({followedUsers.length})</h2>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedUser(null)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                      selectedUser === null ? 'bg-blue-600' : 'hover:bg-gray-800'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                    </div>
                    <span className="text-white text-sm">All</span>
                  </button>

                  {followedUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUser(user.id === selectedUser ? null : user.id)}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                        selectedUser === user.id ? 'bg-blue-600' : 'hover:bg-gray-800'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.username} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          (user.displayName || user.username)[0].toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-white text-sm truncate">{user.displayName || user.username}</p>
                        <p className="text-xs text-gray-400">{user.videoCount} videos</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {/* Type Filter */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => { setActiveType(null); setPage(1); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeType === null
                      ? 'bg-white text-black'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => { setActiveType('FULL'); setPage(1); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeType === 'FULL'
                      ? 'bg-white text-black'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Videos
                </button>
                <button
                  onClick={() => { setActiveType('CLIP'); setPage(1); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeType === 'CLIP'
                      ? 'bg-white text-black'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Clips
                </button>
              </div>

              {/* Videos */}
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-12 h-12 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin" />
                </div>
              ) : displayedVideos.length === 0 ? (
                <div className="text-center py-16 bg-gray-900 rounded-xl">
                  <svg className="w-16 h-16 text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <h2 className="text-xl font-semibold text-white mb-2">No videos found</h2>
                  <p className="text-gray-400">
                    {selectedUser
                      ? 'This creator hasn\'t uploaded any videos yet'
                      : 'The creators you follow haven\'t uploaded any videos yet'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {displayedVideos.map((video) => (
                      <VideoCard key={video.id} video={video} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && !selectedUser && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                      >
                        Previous
                      </button>
                      <span className="text-gray-400 px-4">
                        Page {page} of {totalPages}
                      </span>
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
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
