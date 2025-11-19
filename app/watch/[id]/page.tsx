import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import VideoPlayer from '@/components/VideoPlayer'
import Link from 'next/link'

interface WatchPageProps {
  params: Promise<{ id: string }>
}

async function getVideo(id: string) {
  try {
    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        user: true,
        comments: {
          include: { user: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (video) {
      // Increment view count
      await prisma.video.update({
        where: { id },
        data: { viewCount: { increment: 1 } }
      })
    }

    return video
  } catch {
    return null
  }
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { id } = await params
  const video = await getVideo(id)

  if (!video) {
    notFound()
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Video Player */}
      <div className="rounded-lg overflow-hidden bg-black">
        <VideoPlayer
          src={video.filePath}
          poster={video.thumbnailPath || undefined}
        />
      </div>

      {/* Video Info */}
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-white">{video.title}</h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
          <span>{video.viewCount.toLocaleString()} views</span>
          <span>•</span>
          <span>{formatDate(video.createdAt)}</span>
          {video.gameTitle && (
            <>
              <span>•</span>
              <span className="text-purple-400">{video.gameTitle}</span>
            </>
          )}
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            video.videoType === 'CLIP'
              ? 'bg-purple-600/20 text-purple-400'
              : 'bg-blue-600/20 text-blue-400'
          }`}>
            {video.videoType === 'CLIP' ? 'Clip' : 'Full Video'}
          </span>
        </div>

        {/* Uploader Info */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-800">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <span className="text-white font-medium">
              {video.user.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-white font-medium">{video.user.username}</p>
            <p className="text-sm text-gray-400">Uploaded on {formatDate(video.createdAt)}</p>
          </div>
        </div>

        {/* Description */}
        {video.description && (
          <div className="bg-gray-900/50 rounded-lg p-4">
            <p className="text-gray-300 whitespace-pre-wrap">{video.description}</p>
          </div>
        )}

        {/* Parent Video Link (if this is a clip) */}
        {video.parentVideoId && (
          <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
            <p className="text-sm text-purple-400 mb-2">This clip was made from:</p>
            <Link
              href={`/watch/${video.parentVideoId}`}
              className="text-white hover:text-purple-400 transition-colors"
            >
              View Original Video →
            </Link>
          </div>
        )}
      </div>

      {/* Comments Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">
          Comments ({video.comments.length})
        </h2>

        {video.comments.length > 0 ? (
          <div className="space-y-4">
            {video.comments.map((comment) => (
              <div key={comment.id} className="bg-gray-900/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-white font-medium">{comment.user.username}</span>
                  {comment.timestamp !== null && (
                    <span className="text-purple-400 text-sm">
                      @ {Math.floor(comment.timestamp / 60)}:{(comment.timestamp % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                  <span className="text-gray-500 text-sm">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
                <p className="text-gray-300">{comment.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-900/50 rounded-lg">
            <p className="text-gray-500">No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>
    </div>
  )
}
