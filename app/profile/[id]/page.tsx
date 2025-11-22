import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import VideoCard from '@/components/VideoCard'
import ProfileClient from './ProfileClient'

async function getUser(id: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/users/${id}`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.user
  } catch (error) {
    return null
  }
}

async function getUserVideos(id: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/users/${id}/videos`, {
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.videos || []
  } catch (error) {
    return []
  }
}

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const user = await getUser(id)
  const videos = await getUserVideos(id)

  if (!user) {
    notFound()
  }

  const isOwnProfile = session?.user?.id === id

  return (
    <div>
      {/* Banner */}
      <div className="relative h-48 md:h-64 bg-gray-800 -mx-6 -mt-6 mb-6 overflow-hidden">
        {user.bannerUrl ? (
          <img
            src={user.bannerUrl}
            alt={`${user.displayName || user.username}'s banner`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-900/50 via-purple-900/50 to-pink-900/50" />
        )}
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/50 to-transparent" />
      </div>

      {/* Profile Header */}
      <div className="relative -mt-24 mb-8 px-6">
        <div className="flex flex-col md:flex-row items-start gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0 relative">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.displayName || user.username}
                className="w-32 h-32 rounded-full border-4 border-gray-950 bg-gray-800"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-700 border-4 border-gray-950 flex items-center justify-center">
                <span className="text-4xl font-bold text-gray-300">
                  {(user.displayName || user.username)[0].toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 pt-4 md:pt-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">
                  {user.displayName || user.username}
                </h1>
                <p className="text-gray-400">@{user.username}</p>
              </div>

              {/* Action Button */}
              <ProfileClient
                userId={id}
                isOwnProfile={isOwnProfile}
                isFollowing={user.isFollowing || false}
                user={user}
              />
            </div>

            {/* Bio */}
            {user.bio && (
              <p className="text-gray-300 mb-4 max-w-2xl">{user.bio}</p>
            )}

            {/* Stats */}
            <div className="flex gap-6 text-sm">
              <div>
                <span className="font-bold text-white">{user._count?.videos || 0}</span>
                <span className="text-gray-400 ml-1">Videos</span>
              </div>
              <div>
                <span className="font-bold text-white">{user._count?.followers || 0}</span>
                <span className="text-gray-400 ml-1">Followers</span>
              </div>
              <div>
                <span className="font-bold text-white">{user._count?.following || 0}</span>
                <span className="text-gray-400 ml-1">Following</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Videos Section */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">
          {isOwnProfile ? 'Your Videos' : `${user.displayName || user.username}'s Videos`}
        </h2>

        {videos.length === 0 ? (
          <div className="text-center py-12 bg-gray-900 rounded-lg">
            <svg className="mx-auto h-12 w-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-white">No videos yet</h3>
            {isOwnProfile && (
              <p className="mt-1 text-sm text-gray-500">Upload your first video to get started.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((video: any) => (
              <VideoCard key={video.id} {...video} uploader={user} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
