'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AnalyticsData {
  totalStats: {
    totalViews: number
    totalLikes: number
    totalComments: number
    totalClipsCreated: number
    totalVideos: number
  }
  topVideos: Array<{
    id: string
    title: string
    viewCount: number
    likeCount: number
    commentCount: number
    clipCount: number
    game: { id: string; name: string } | null
    createdAt: Date
  }>
  chartData: Array<{
    date: string
    views: number
  }>
  videoCount: number
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics')

      if (res.status === 401) {
        router.push('/login?callbackUrl=/analytics')
        return
      }

      if (!res.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const analyticsData = await res.json()
      setData(analyticsData)
      setError('')
    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError('Failed to load analytics')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-400">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-6 text-center">
          <p className="text-red-200">{error || 'No analytics data available'}</p>
        </div>
      </div>
    )
  }

  const maxChartValue = Math.max(...data.chartData.map(d => d.views), 1)

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header - Gaming HUD Style */}
      <div className="mb-8 relative overflow-hidden rounded-xl border-2 border-cyan-500/30 bg-gradient-to-r from-cyan-900/20 via-gray-900 to-purple-900/20 p-6 shadow-2xl shadow-cyan-500/20">
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-xl shadow-cyan-500/50">
              <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-1 flex items-center gap-3">
                Analytics Command Center
              </h1>
              <p className="text-cyan-300">Real-time performance metrics and insights</p>
            </div>
          </div>
        </div>
        {/* Decorative HUD elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-4 right-4 text-cyan-400 text-xs font-mono opacity-50">
          SYS.ANALYTICS.V2
        </div>
      </div>

      {/* Stats Cards - Gaming HUD Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="relative bg-gray-900 rounded-lg p-6 border-2 border-gray-700 hover:border-gray-500 transition-all shadow-lg hover:shadow-xl group">
          <div className="absolute top-2 right-2 w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
            Total Videos
          </div>
          <div className="text-4xl font-bold text-white">{data.totalStats.totalVideos}</div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-700 to-gray-500"></div>
        </div>

        <div className="relative bg-gray-900 rounded-lg p-6 border-2 border-blue-500/30 hover:border-blue-500 transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 group">
          <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <div className="text-blue-300 text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Total Views
          </div>
          <div className="text-4xl font-bold text-blue-400">{data.totalStats.totalViews.toLocaleString()}</div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-cyan-500"></div>
        </div>

        <div className="relative bg-gray-900 rounded-lg p-6 border-2 border-red-500/30 hover:border-red-500 transition-all shadow-lg shadow-red-500/20 hover:shadow-red-500/40 group">
          <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <div className="text-red-300 text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
            </svg>
            Total Likes
          </div>
          <div className="text-4xl font-bold text-red-400">{data.totalStats.totalLikes.toLocaleString()}</div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 to-pink-500"></div>
        </div>

        <div className="relative bg-gray-900 rounded-lg p-6 border-2 border-green-500/30 hover:border-green-500 transition-all shadow-lg shadow-green-500/20 hover:shadow-green-500/40 group">
          <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <div className="text-green-300 text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Comments
          </div>
          <div className="text-4xl font-bold text-green-400">{data.totalStats.totalComments.toLocaleString()}</div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-600 to-emerald-500"></div>
        </div>

        <div className="relative bg-gray-900 rounded-lg p-6 border-2 border-purple-500/30 hover:border-purple-500 transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 group">
          <div className="absolute top-2 right-2 w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
          <div className="text-purple-300 text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            </svg>
            Clips Created
          </div>
          <div className="text-4xl font-bold text-purple-400">{data.totalStats.totalClipsCreated.toLocaleString()}</div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-pink-500"></div>
        </div>
      </div>

      {/* Views Chart - Gaming Style */}
      {data.chartData.length > 0 && (
        <div className="relative bg-gray-900 rounded-lg p-6 border-2 border-cyan-500/30 shadow-xl shadow-cyan-500/10 mb-8 overflow-hidden">
          <div className="absolute top-4 right-4 text-cyan-400 text-xs font-mono opacity-50">
            CHART.VIEWS.30D
          </div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            Views Timeline (Last 30 Days)
          </h2>
          <div className="flex items-end gap-1 h-64 bg-gray-950/50 rounded-lg p-4">
            {data.chartData.map((point, index) => (
              <div key={point.date} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-cyan-600 to-blue-500 hover:from-cyan-500 hover:to-blue-400 transition-all rounded-t relative group cursor-pointer shadow-lg hover:shadow-cyan-500/50"
                  style={{ height: `${(point.views / maxChartValue) * 100}%` }}
                >
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 border border-cyan-500/50 text-white text-xs rounded-lg py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl z-10">
                    <div className="text-cyan-400 font-bold">{point.views} views</div>
                    <div className="text-gray-300">{new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  </div>
                  {/* Pulsing top indicator */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-gray-500 text-center">
            Hover over bars for details
          </div>
        </div>
      )}

      {/* Top Videos - Gaming Leaderboard Style */}
      <div className="relative bg-gray-900 rounded-lg p-6 border-2 border-purple-500/30 shadow-xl shadow-purple-500/10 overflow-hidden">
        <div className="absolute top-4 right-4 text-purple-400 text-xs font-mono opacity-50">
          LEADERBOARD.TOP10
        </div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Top Performing Videos
        </h2>
        {data.topVideos.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No videos yet. Upload your first video!</p>
        ) : (
          <div className="overflow-x-auto bg-gray-950/50 rounded-lg">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b-2 border-purple-500/30">
                  <th className="pb-3 pt-2 px-4 text-purple-300 font-bold text-xs uppercase tracking-wider">Rank</th>
                  <th className="pb-3 pt-2 px-4 text-purple-300 font-bold text-xs uppercase tracking-wider">Title</th>
                  <th className="pb-3 pt-2 px-4 text-purple-300 font-bold text-xs uppercase tracking-wider">Game</th>
                  <th className="pb-3 pt-2 px-4 text-purple-300 font-bold text-xs uppercase tracking-wider text-right">Views</th>
                  <th className="pb-3 pt-2 px-4 text-purple-300 font-bold text-xs uppercase tracking-wider text-right">Likes</th>
                  <th className="pb-3 pt-2 px-4 text-purple-300 font-bold text-xs uppercase tracking-wider text-right">Comments</th>
                  <th className="pb-3 pt-2 px-4 text-purple-300 font-bold text-xs uppercase tracking-wider text-right">Clips</th>
                  <th className="pb-3 pt-2 px-4 text-purple-300 font-bold text-xs uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody>
                {data.topVideos.map((video, index) => (
                  <tr key={video.id} className="border-b border-gray-800 hover:bg-purple-900/20 transition-all group">
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-sm shadow-lg shadow-purple-500/50">
                        {index + 1}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-medium text-white line-clamp-1 group-hover:text-purple-400 transition-colors">{video.title}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(video.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {video.game ? (
                        <span className="inline-block bg-blue-900/50 text-blue-400 text-xs px-2 py-1 rounded border border-blue-500/30">{video.game.name}</span>
                      ) : (
                        <span className="text-sm text-gray-600">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="inline-flex items-center gap-1 text-blue-400 font-bold">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {video.viewCount.toLocaleString()}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="inline-flex items-center gap-1 text-red-400 font-bold">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                        </svg>
                        {video.likeCount.toLocaleString()}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="inline-flex items-center gap-1 text-green-400 font-bold">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {video.commentCount.toLocaleString()}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="inline-flex items-center gap-1 text-purple-400 font-bold">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        </svg>
                        {video.clipCount.toLocaleString()}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        href={`/watch/${video.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded-lg font-medium transition-all shadow-lg hover:shadow-purple-500/50"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
