import VideoCard from '@/components/VideoCard'
import FeaturedHero from '@/components/FeaturedHero'
import ActiveWatchPartiesWidget from '@/components/ActiveWatchPartiesWidget'
import Link from 'next/link'

async function getVideos() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/videos?limit=20`, {
      cache: 'no-store',
    })
    if (!res.ok) throw new Error('Failed to fetch videos')
    const data = await res.json()
    return data.videos || []
  } catch (error) {
    console.error('Error fetching videos:', error)
    return []
  }
}

async function getActiveWatchParties() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/watch-party/active`, {
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.parties?.slice(0, 3) || []
  } catch (error) {
    console.error('Error fetching active parties:', error)
    return []
  }
}

export default async function HomePage() {
  const videos = await getVideos()
  const activeParties = await getActiveWatchParties()

  // Featured video is the most recent one or most viewed
  const featuredVideo = videos.length > 0 ? videos.reduce((max: any, video: any) =>
    video.viewCount > max.viewCount ? video : max, videos[0]
  ) : null

  const trendingVideos = videos
    .sort((a: any, b: any) => b.viewCount - a.viewCount)
    .slice(0, 8)

  const latestVideos = videos
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8)

  return (
    <div className="space-y-12">
      {/* Featured Hero Section */}
      {featuredVideo && (
        <FeaturedHero video={featuredVideo} />
      )}

      {/* Active Watch Parties Widget */}
      {activeParties.length > 0 && (
        <ActiveWatchPartiesWidget parties={activeParties} />
      )}

      {/* Trending Videos */}
      {trendingVideos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="text-neon-pink">🔥</span>
                Trending Now
              </h2>
              <p className="text-gray-400 mt-1">Most viewed gaming moments</p>
            </div>
            <Link
              href="/full-videos"
              className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
            >
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {trendingVideos.map((video: any) => (
              <VideoCard key={video.id} {...video} />
            ))}
          </div>
        </div>
      )}

      {/* Latest Videos */}
      {latestVideos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="text-neon-cyan">✨</span>
                Latest Uploads
              </h2>
              <p className="text-gray-400 mt-1">Fresh content from the community</p>
            </div>
            <Link
              href="/full-videos"
              className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
            >
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {latestVideos.map((video: any) => (
              <VideoCard key={video.id} {...video} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {videos.length === 0 && (
        <div className="text-center py-16 bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-800">
          <svg className="mx-auto h-16 w-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <h3 className="text-xl font-bold text-white mb-2">No videos yet</h3>
          <p className="text-gray-400 mb-6">Get started by uploading your first gaming moment!</p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg font-medium shadow-lg shadow-blue-500/50 transition-all duration-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload Video
          </Link>
        </div>
      )}
    </div>
  )
}
