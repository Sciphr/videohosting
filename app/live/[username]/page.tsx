'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Hls from 'hls.js'

interface Stream {
  id: string
  title: string
  description: string | null
  status: 'OFFLINE' | 'LIVE' | 'ENDED'
  hlsUrl: string | null
  thumbnailUrl: string | null
  viewerCount: number
  startedAt: string | null
  user: {
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
    bio: string | null
  }
  game: {
    id: string
    name: string
    slug: string
    coverImageUrl: string | null
  } | null
}

interface ChatMessage {
  id: string
  message: string
  username: string
  createdAt: string
}

export default function LiveStreamPage() {
  const params = useParams()
  const username = params.username as string
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const [stream, setStream] = useState<Stream | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [sendingChat, setSendingChat] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [showChat, setShowChat] = useState(true)
  const [isTheaterMode, setIsTheaterMode] = useState(false)

  // Fetch stream data
  useEffect(() => {
    const fetchStream = async () => {
      try {
        const res = await fetch(`/api/streams/${username}`)
        if (res.status === 404) {
          setError('Stream not found')
          return
        }
        if (!res.ok) throw new Error('Failed to fetch stream')

        const data = await res.json()
        setStream(data)
      } catch (err) {
        console.error('Failed to fetch stream:', err)
        setError('Failed to load stream')
      } finally {
        setLoading(false)
      }
    }

    fetchStream()

    // Poll for updates every 10 seconds
    const interval = setInterval(fetchStream, 10000)
    return () => clearInterval(interval)
  }, [username])

  // Initialize HLS player
  useEffect(() => {
    if (!stream || stream.status !== 'LIVE' || !videoRef.current) return

    const hlsUrl = stream.hlsUrl || `http://${window.location.hostname}:8000/live/${stream.id}/index.m3u8`

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      })

      hls.loadSource(hlsUrl)
      hls.attachMedia(videoRef.current)

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoRef.current?.play().catch(() => {})
      })

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('Network error, attempting to recover...')
              hls.startLoad()
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('Media error, attempting to recover...')
              hls.recoverMediaError()
              break
            default:
              console.error('Fatal HLS error:', data)
              hls.destroy()
              break
          }
        }
      })

      hlsRef.current = hls
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      videoRef.current.src = hlsUrl
      videoRef.current.addEventListener('loadedmetadata', () => {
        videoRef.current?.play().catch(() => {})
      })
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [stream])

  // Fetch chat messages
  useEffect(() => {
    if (!stream?.id) return

    const fetchChat = async () => {
      try {
        const res = await fetch(`/api/streams/${stream.id}/chat`)
        if (res.ok) {
          const messages = await res.json()
          setChatMessages(messages)
        }
      } catch (err) {
        console.error('Failed to fetch chat:', err)
      }
    }

    fetchChat()
    const interval = setInterval(fetchChat, 3000)
    return () => clearInterval(interval)
  }, [stream?.id])

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatMessages])

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || !stream?.id || sendingChat) return

    setSendingChat(true)
    try {
      const res = await fetch(`/api/streams/${stream.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: chatInput.trim() }),
      })

      if (res.ok) {
        setChatInput('')
        // Fetch latest messages
        const chatRes = await fetch(`/api/streams/${stream.id}/chat`)
        if (chatRes.ok) {
          setChatMessages(await chatRes.json())
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setSendingChat(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getStreamDuration = (startedAt: string) => {
    const start = new Date(startedAt)
    const now = new Date()
    const diffMs = now.getTime() - start.getTime()
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !stream) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">{error || 'Stream not found'}</h1>
          <Link href="/streams" className="text-violet-400 hover:text-violet-300">
            Browse live streams
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isTheaterMode ? 'bg-black' : ''}`}>
      <div className={`flex ${isTheaterMode ? 'flex-col' : 'flex-col lg:flex-row'}`}>
        {/* Main Content */}
        <div className={`flex-1 ${isTheaterMode ? '' : 'lg:max-w-[calc(100%-380px)]'}`}>
          {/* Video Player */}
          <div className={`relative bg-black ${isTheaterMode ? 'h-[70vh]' : 'aspect-video'}`}>
            {stream.status === 'LIVE' ? (
              <video
                ref={videoRef}
                className="w-full h-full"
                controls
                playsInline
                poster={stream.thumbnailUrl || undefined}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
                {stream.thumbnailUrl && (
                  <img
                    src={stream.thumbnailUrl}
                    alt={stream.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                  />
                )}
                <div className="relative z-10 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-white mb-2">Stream Offline</h2>
                  <p className="text-gray-400">
                    {stream.user.displayName || stream.user.username} is not currently streaming
                  </p>
                </div>
              </div>
            )}

            {/* Live Badge */}
            {stream.status === 'LIVE' && (
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="px-2 py-1 bg-red-600 text-white text-sm font-medium rounded flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  LIVE
                </span>
                <span className="px-2 py-1 bg-black/70 text-white text-sm rounded">
                  {stream.viewerCount} viewers
                </span>
                {stream.startedAt && (
                  <span className="px-2 py-1 bg-black/70 text-white text-sm rounded">
                    {getStreamDuration(stream.startedAt)}
                  </span>
                )}
              </div>
            )}

            {/* Controls */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <button
                onClick={() => setIsTheaterMode(!isTheaterMode)}
                className="p-2 bg-black/70 hover:bg-black/90 text-white rounded transition-colors"
                title={isTheaterMode ? 'Exit Theater Mode' : 'Theater Mode'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
              <button
                onClick={() => setShowChat(!showChat)}
                className="p-2 bg-black/70 hover:bg-black/90 text-white rounded transition-colors lg:hidden"
                title={showChat ? 'Hide Chat' : 'Show Chat'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Stream Info */}
          <div className={`p-4 ${isTheaterMode ? 'bg-gray-900' : ''}`}>
            <div className="flex items-start gap-4">
              <Link href={`/@${stream.user.username}`}>
                <div className="w-12 h-12 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                  {stream.user.avatarUrl ? (
                    <img src={stream.user.avatarUrl} alt={stream.user.username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg font-medium">
                      {(stream.user.displayName || stream.user.username)[0].toUpperCase()}
                    </div>
                  )}
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-white truncate">{stream.title}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Link href={`/@${stream.user.username}`} className="text-violet-400 hover:text-violet-300 font-medium">
                    {stream.user.displayName || stream.user.username}
                  </Link>
                  {stream.game && (
                    <>
                      <span className="text-gray-600">•</span>
                      <Link href={`/games/${stream.game.slug}`} className="text-gray-400 hover:text-gray-300">
                        {stream.game.name}
                      </Link>
                    </>
                  )}
                </div>
                {stream.description && (
                  <p className="text-gray-400 text-sm mt-2 line-clamp-2">{stream.description}</p>
                )}
              </div>
              <button
                onClick={() => setIsFollowing(!isFollowing)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex-shrink-0 ${
                  isFollowing
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-violet-600 hover:bg-violet-700 text-white'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        {showChat && (
          <div className={`${isTheaterMode ? 'h-[30vh]' : 'lg:w-[380px] h-[500px] lg:h-auto'} flex flex-col bg-gray-900 border-l border-gray-800`}>
            <div className="p-3 border-b border-gray-800 flex items-center justify-between">
              <h3 className="font-semibold text-white">Stream Chat</h3>
              <button
                onClick={() => setShowChat(false)}
                className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors hidden lg:block"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Chat Messages */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-3 space-y-2"
            >
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>No messages yet</p>
                  <p className="text-sm">Be the first to say something!</p>
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} className="text-sm">
                    <span className="text-gray-500 text-xs mr-2">{formatTime(msg.createdAt)}</span>
                    <span className="text-violet-400 font-medium">{msg.username}</span>
                    <span className="text-gray-300">: {msg.message}</span>
                  </div>
                ))
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} className="p-3 border-t border-gray-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Send a message..."
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  disabled={stream.status !== 'LIVE'}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || sendingChat || stream.status !== 'LIVE'}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  Chat
                </button>
              </div>
              {stream.status !== 'LIVE' && (
                <p className="text-gray-500 text-xs mt-2">Chat is disabled when stream is offline</p>
              )}
            </form>
          </div>
        )}

        {/* Show Chat Toggle (when chat is hidden on desktop) */}
        {!showChat && (
          <button
            onClick={() => setShowChat(true)}
            className="hidden lg:flex fixed right-4 top-1/2 -translate-y-1/2 p-3 bg-gray-800 hover:bg-gray-700 text-white rounded-l-lg border border-gray-700 border-r-0 transition-colors"
            title="Show Chat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
