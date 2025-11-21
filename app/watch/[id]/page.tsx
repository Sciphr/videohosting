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
    <div className="max-w-full mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Video Player, Like Button, and Comments */}
          <WatchPageClient
            video={{
              id: video.id,
              fileUrl: video.fileUrl,
              thumbnailUrl: video.thumbnailUrl,
              likeCount: video.likeCount || 0,
              commentCount: video.commentCount || 0,
            }}
            fullVideo={video}
            isAuthenticated={!!session}
            currentUserId={session?.user?.id}
          />

      {/* Parent Video Link (if this is a clip) */}
      {video.videoType === 'CLIP' && video.parentVideo && (
        <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-blue-200 text-sm mb-2">
                This is a clip from{' '}
                <Link
                  href={`/profile/${video.parentVideo.uploader.id}`}
                  className="font-medium hover:text-blue-100 underline"
                >
                  {video.parentVideo.uploader.displayName || video.parentVideo.uploader.username}
                </Link>
                's video
              </p>
              <Link
                href={`/watch/${video.parentVideo.id}`}
                className="inline-flex items-center gap-2 text-white font-medium hover:text-blue-100"
              >
                <span>Watch full video: {video.parentVideo.title}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              {video.clipStartTime !== null && video.clipEndTime !== null && (
                <p className="text-blue-300 text-sm mt-1">
                  Clip from {Math.floor(video.clipStartTime / 60)}:{(Math.floor(video.clipStartTime) % 60).toString().padStart(2, '0')} - {Math.floor(video.clipEndTime / 60)}:{(Math.floor(video.clipEndTime) % 60).toString().padStart(2, '0')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Video Info */}
      <div className="bg-gray-900 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-white mb-4">
          {video.title}
        </h1>

        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-4 flex-wrap">
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
            <span className="text-gray-500 text-sm">•</span>
            <span className="text-gray-400 text-sm">
              {new Date(video.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </div>
          <div className="text-gray-400 text-sm">
            {video.viewCount.toLocaleString()} views
          </div>
        </div>

        {/* Tags */}
        {video.tags && video.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {video.tags.map((videoTag: any) => (
              <span
                key={videoTag.tag.id}
                className="bg-gray-800 text-gray-300 text-xs px-3 py-1 rounded-full"
              >
                #{videoTag.tag.name}
              </span>
            ))}
          </div>
        )}

        {video.description && (
          <div className="border-t border-gray-800 pt-4">
            <p className="text-gray-300 whitespace-pre-wrap">
              {video.description}
            </p>
          </div>
        )}
      </div>

        </div>

        {/* Sidebar - Related Content */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 space-y-4">
            {/* Clips from this video */}
            {video.videoType === 'FULL' && video.clips && video.clips.length > 0 && (
              <div className="bg-gray-900 rounded-lg border-2 border-purple-500/30 p-4 shadow-lg shadow-purple-500/10">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  </svg>
                  Clips from this video
                </h2>
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {video.clips.slice(0, 10).map((clip: any) => (
                    <Link key={clip.id} href={`/watch/${clip.id}`}>
                      <div className="group bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-purple-500 transition-all">
                        <div className="relative aspect-video bg-gray-700">
                          {clip.thumbnailUrl ? (
                            <img src={clip.thumbnailUrl} alt={clip.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-600">
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              </svg>
                            </div>
                          )}
                          {clip.duration && (
                            <div className="absolute bottom-2 right-2 bg-black/90 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                              {Math.floor(clip.duration / 60)}:{(clip.duration % 60).toString().padStart(2, '0')}
                            </div>
                          )}
                          <div className="absolute top-2 left-2 bg-cyan-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                            CLIP
                          </div>
                        </div>
                        <div className="p-2">
                          <h3 className="text-white text-sm font-medium line-clamp-2 group-hover:text-purple-400 transition-colors">
                            {clip.title}
                          </h3>
                          <p className="text-gray-500 text-xs mt-1">
                            {clip.viewCount} views
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Gaming Stats HUD */}
            <div className="bg-gray-900 rounded-lg border-2 border-cyan-500/30 p-4 shadow-lg shadow-cyan-500/10">
              <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Video Stats
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Views</span>
                  <span className="text-white font-bold">{video.viewCount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Likes</span>
                  <span className="text-red-400 font-bold">{(video.likeCount || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Comments</span>
                  <span className="text-green-400 font-bold">{(video.commentCount || 0).toLocaleString()}</span>
                </div>
                {video.videoType === 'FULL' && video.clips && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Clips Created</span>
                    <span className="text-purple-400 font-bold">{video.clips.length}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-800">
                  <span className="text-gray-400">Duration</span>
                  <span className="text-cyan-400 font-bold">
                    {video.duration ? `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
