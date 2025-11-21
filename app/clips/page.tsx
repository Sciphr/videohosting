import ClipCard from '@/components/ClipCard'
import Link from 'next/link'

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
      {/* Header with TikTok-style gradient */}
      <div className="mb-8 relative overflow-hidden rounded-xl border-2 border-cyan-500/30 bg-gradient-to-r from-cyan-900/20 via-gray-900 to-blue-900/20 p-6 shadow-xl shadow-cyan-500/10">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/50">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Gaming Clips
              </h1>
              <p className="text-gray-300">
                Epic moments in bite-sized format • 15s - 2min
              </p>
            </div>
          </div>
        </div>
        {/* Decorative glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      {clips.length === 0 ? (
        <div className="text-center py-16 bg-gray-900/50 rounded-xl border-2 border-dashed border-gray-800">
          <svg className="mx-auto h-16 w-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-bold text-white mb-2">No clips yet</h3>
          <p className="text-gray-400 mb-6">Create your first epic gaming moment</p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg font-medium shadow-lg shadow-cyan-500/50 transition-all duration-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload Clip
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {clips.map((video: any) => (
            <ClipCard key={video.id} {...video} />
          ))}
        </div>
      )}
    </div>
  )
}
