import VideoCard from '@/components/VideoCard'
import prisma from '@/lib/prisma'

async function getFullVideos() {
  try {
    const videos = await prisma.video.findMany({
      where: { videoType: 'FULL' },
      orderBy: { createdAt: 'desc' },
      include: { user: true }
    })
    return videos
  } catch {
    return []
  }
}

export default async function VideosPage() {
  const videos = await getFullVideos()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Full Videos</h1>
          <p className="text-gray-400 mt-1">Complete gameplay sessions and streams</p>
        </div>
      </div>

      {videos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-900/50 rounded-lg">
          <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <h3 className="text-xl font-medium text-gray-400 mb-2">No full videos yet</h3>
          <p className="text-gray-500">Upload your first gameplay session!</p>
        </div>
      )}
    </div>
  )
}
