'use client'

import Link from 'next/link'

interface ActiveParty {
  id: string
  roomCode: string
  video: {
    id: string
    title: string
    thumbnailUrl: string | null
  }
  host: {
    id: string
    username: string
    displayName: string | null
  }
  participantCount: number
}

interface ActiveWatchPartiesWidgetProps {
  parties: ActiveParty[]
}

export default function ActiveWatchPartiesWidget({ parties }: ActiveWatchPartiesWidgetProps) {
  if (parties.length === 0) return null

  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-purple-500/30 bg-gradient-to-r from-purple-900/20 via-gray-900 to-pink-900/20 p-6 shadow-xl shadow-purple-500/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/50">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              Active Watch Parties
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-full animate-pulse">
                <span className="w-2 h-2 bg-white rounded-full"></span>
                LIVE
              </span>
            </h2>
            <p className="text-gray-400 text-sm">Join friends watching together right now</p>
          </div>
        </div>
        <Link
          href="/party/active"
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-all duration-300 shadow-lg shadow-purple-500/50 hover:shadow-purple-500/80"
        >
          View All
        </Link>
      </div>

      {/* Parties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {parties.map((party) => (
          <Link
            key={party.id}
            href={`/party/${party.roomCode}`}
            className="group relative bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-800 hover:border-purple-500 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20"
          >
            {/* Video Thumbnail */}
            <div className="relative aspect-video bg-gray-800">
              {party.video.thumbnailUrl ? (
                <img
                  src={party.video.thumbnailUrl}
                  alt={party.video.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  </svg>
                </div>
              )}

              {/* Live Badge */}
              <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                LIVE
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="w-12 h-12 rounded-full bg-purple-600/80 flex items-center justify-center mx-auto mb-2 backdrop-blur-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <p className="text-xs font-bold">JOIN PARTY</p>
                </div>
              </div>
            </div>

            {/* Party Info */}
            <div className="p-3">
              <h3 className="text-white font-semibold text-sm line-clamp-1 mb-2 group-hover:text-purple-400 transition-colors">
                {party.video.title}
              </h3>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">
                  by {party.host.displayName || party.host.username}
                </span>
                <div className="flex items-center gap-1 text-purple-400 font-semibold">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  {party.participantCount}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Decorative glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl -z-10"></div>
    </div>
  )
}
