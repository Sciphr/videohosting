import VideoCard from '@/components/VideoCard'

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

export default async function HomePage() {
  const videos = await getVideos()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Latest Videos
        </h1>
        <p className="text-gray-400">
          Check out the newest gaming clips and full videos
        </p>
      </div>

      {videos.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-white">No videos yet</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by uploading your first video.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map((video: any) => (
            <VideoCard key={video.id} {...video} />
          ))}
        </div>
      )}
    </div>
  )
}
