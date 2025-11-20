import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import WatchPageClient from './WatchPageClient'

async function getVideo(id: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/videos/${id}`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.video
  } catch (error) {
    return null
  }
}

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const video = await getVideo(id)
  const session = await auth()

  if (!video) {
    notFound()
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Video Player */}
      <WatchPageClient video={video} />

      {/* Video Info */}
      <div className="bg-gray-900 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-white mb-4">
          {video.title}
        </h1>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link 
              href={`/profile/${video.uploader.id}`}
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              {video.uploader.displayName || video.uploader.username}
            </Link>
            {video.game && (
              <span className="bg-blue-900/30 text-blue-400 text-sm px-3 py-1 rounded">
                {video.game.name}
              </span>
            )}
          </div>
          <div className="text-gray-400 text-sm">
            {video.viewCount.toLocaleString()} views
          </div>
        </div>

        {video.description && (
          <div className="border-t border-gray-800 pt-4">
            <p className="text-gray-300 whitespace-pre-wrap">
              {video.description}
            </p>
          </div>
        )}
      </div>

      {/* Clips Section */}
      {video.videoType === 'FULL' && video.clips && video.clips.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-white mb-4">
            Clips from this video
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {video.clips.map((clip: any) => (
              <Link key={clip.id} href={`/watch/${clip.id}`}>
                <div className="bg-gray-900 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all">
                  <div className="relative aspect-video bg-gray-800">
                    {clip.thumbnailUrl ? (
                      <img src={clip.thumbnailUrl} alt={clip.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        </svg>
                      </div>
                    )}
                    {clip.duration && (
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded">
                        {Math.floor(clip.duration / 60)}:{(clip.duration % 60).toString().padStart(2, '0')}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-white text-sm font-medium line-clamp-2">{clip.title}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
