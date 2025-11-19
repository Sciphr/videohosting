import VideoCard from '@/components/VideoCard'
import prisma from '@/lib/prisma'

async function getClips() {
  try {
    const videos = await prisma.video.findMany({
      where: { videoType: 'CLIP' },
      orderBy: { createdAt: 'desc' },
      include: { user: true }
    })
    return videos
  } catch {
    return []
  }
}

export default async function ClipsPage() {
  const clips = await getClips()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Clips</h1>
          <p className="text-gray-400 mt-1">Quick highlights and clutch moments</p>
        </div>
      </div>

      {clips.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {clips.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-900/50 rounded-lg">
          <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <h3 className="text-xl font-medium text-gray-400 mb-2">No clips yet</h3>
          <p className="text-gray-500">Upload your first gaming highlight!</p>
        </div>
      )}
    </div>
  )
}
