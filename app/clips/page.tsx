import VideoCard from '@/components/VideoCard'

async function getClips() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/videos?type=CLIP&limit=20`, {
      cache: 'no-store',
    })
    if (!res.ok) throw new Error('Failed to fetch clips')
    const data = await res.json()
    return data.videos || []
  } catch (error) {
    console.error('Error fetching clips:', error)
    return []
  }
}

export default async function ClipsPage() {
  const clips = await getClips()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Clips
        </h1>
        <p className="text-gray-400">
          Quick gaming moments and highlights (15s - 2min)
        </p>
      </div>

      {clips.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-white">No clips yet</h3>
          <p className="mt-1 text-sm text-gray-500">Upload your first clip to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {clips.map((video: any) => (
            <VideoCard key={video.id} {...video} />
          ))}
        </div>
      )}
    </div>
  )
}
