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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
        <p className="text-gray-400">View performance metrics for your videos</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <div className="text-gray-400 text-sm mb-1">Total Videos</div>
          <div className="text-3xl font-bold text-white">{data.totalStats.totalVideos}</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <div className="text-gray-400 text-sm mb-1">Total Views</div>
          <div className="text-3xl font-bold text-blue-400">{data.totalStats.totalViews.toLocaleString()}</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <div className="text-gray-400 text-sm mb-1">Total Likes</div>
          <div className="text-3xl font-bold text-red-400">{data.totalStats.totalLikes.toLocaleString()}</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <div className="text-gray-400 text-sm mb-1">Total Comments</div>
          <div className="text-3xl font-bold text-green-400">{data.totalStats.totalComments.toLocaleString()}</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <div className="text-gray-400 text-sm mb-1">Clips Created</div>
          <div className="text-3xl font-bold text-purple-400">{data.totalStats.totalClipsCreated.toLocaleString()}</div>
        </div>
      </div>

      {/* Views Chart */}
      {data.chartData.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Views (Last 30 Days)</h2>
          <div className="flex items-end gap-1 h-64">
            {data.chartData.map((point) => (
              <div key={point.date} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-blue-600 hover:bg-blue-500 transition-colors rounded-t relative group cursor-pointer"
                  style={{ height: `${(point.views / maxChartValue) * 100}%` }}
                >
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {point.views} views<br />
                    {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-gray-500 text-center">
            Hover over bars for details
          </div>
        </div>
      )}

      {/* Top Videos */}
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <h2 className="text-xl font-bold text-white mb-4">Top Performing Videos</h2>
        {data.topVideos.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No videos yet. Upload your first video!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-800">
                  <th className="pb-3 text-gray-400 font-medium">Title</th>
                  <th className="pb-3 text-gray-400 font-medium">Game</th>
                  <th className="pb-3 text-gray-400 font-medium text-right">Views</th>
                  <th className="pb-3 text-gray-400 font-medium text-right">Likes</th>
                  <th className="pb-3 text-gray-400 font-medium text-right">Comments</th>
                  <th className="pb-3 text-gray-400 font-medium text-right">Clips</th>
                  <th className="pb-3 text-gray-400 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {data.topVideos.map((video) => (
                  <tr key={video.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                    <td className="py-4">
                      <div className="font-medium text-white line-clamp-1">{video.title}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(video.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-4">
                      {video.game ? (
                        <span className="text-sm text-blue-400">{video.game.name}</span>
                      ) : (
                        <span className="text-sm text-gray-600">-</span>
                      )}
                    </td>
                    <td className="py-4 text-right text-blue-400 font-medium">
                      {video.viewCount.toLocaleString()}
                    </td>
                    <td className="py-4 text-right text-red-400">
                      {video.likeCount.toLocaleString()}
                    </td>
                    <td className="py-4 text-right text-green-400">
                      {video.commentCount.toLocaleString()}
                    </td>
                    <td className="py-4 text-right text-purple-400">
                      {video.clipCount.toLocaleString()}
                    </td>
                    <td className="py-4 text-right">
                      <Link
                        href={`/watch/${video.id}`}
                        className="text-sm text-blue-400 hover:text-blue-300"
                      >
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
