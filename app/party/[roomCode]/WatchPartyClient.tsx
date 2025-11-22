'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { io, Socket } from 'socket.io-client'
import VideoPlayer from '@/components/VideoPlayer'
import Player from 'video.js/dist/types/player'
import type { ServerToClientEvents, ClientToServerEvents, Participant, ChatMessage } from '@/lib/socket'
import { useGlobalToast } from '@/app/context/ToastContext'

interface WatchPartyClientProps {
  watchParty: any
  currentUser: {
    id: string
    username: string
    displayName: string
  } | null
  isAuthenticated: boolean
}

export default function WatchPartyClient({ watchParty, currentUser, isAuthenticated }: WatchPartyClientProps) {
  const router = useRouter()
  const { showToast } = useGlobalToast()
  const playerRef = useRef<Player | null>(null)
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null)
  const chatEndRef = useRef<HTMLDivElement | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isHost, setIsHost] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [guestId, setGuestId] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const ignoreNextEvent = useRef(false)

  const roomCode = watchParty.roomCode

  // Get the current user's ID (either from session or guest ID)
  const getCurrentUserId = () => {
    return currentUser?.id || guestId || ''
  }

  // Initialize guest ID from localStorage on mount
  useEffect(() => {
    if (!currentUser) {
      const storedGuestId = localStorage.getItem(`guest-id-${roomCode}`)
      if (storedGuestId) {
        setGuestId(storedGuestId)
      } else {
        const newGuestId = `guest-${Date.now()}`
        setGuestId(newGuestId)
        localStorage.setItem(`guest-id-${roomCode}`, newGuestId)
      }
    }
  }, [roomCode, currentUser])

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const hostStatus = currentUser ? watchParty.hostId === currentUser.id : false
    setIsHost(hostStatus)

    // Initialize Socket.io connection
    const initSocket = async () => {
      // Initialize Socket.io server
      await fetch('/api/socket')

      const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io({
        path: '/api/socket',
      })

      socketRef.current = socket

      socket.on('connect', () => {
        console.log('Socket.io connected')
        setIsConnected(true)

        const userId = currentUser?.id || guestId
        if (!userId) return

        // Join the watch party room with isHost flag
        socket.emit('party:join', {
          roomCode,
          userId,
          username: currentUser?.username || guestName || 'Guest',
          displayName: currentUser?.displayName || guestName || 'Guest',
          isHost: hostStatus,
        })
      })

      socket.on('disconnect', () => {
        console.log('Socket.io disconnected')
        setIsConnected(false)
      })

      // Participant events
      socket.on('party:user-joined', (data) => {
        console.log('User joined:', data.username)
        showToast(`${data.displayName || data.username} joined the party`, 'info', 3000)
      })

      socket.on('party:user-left', (data) => {
        console.log('User left:', data.username)
        showToast(`${data.username} left the party`, 'info', 3000)
      })

      socket.on('party:participant-list', (data) => {
        setParticipants(data.participants)
      })

      // Synchronized playback events (for guests receiving host's commands)
      socket.on('party:play', (data) => {
        if (playerRef.current && !ignoreNextEvent.current) {
          console.log('Received play command, syncing to:', data.timestamp)
          playerRef.current.currentTime(data.timestamp)
          playerRef.current.play()
        }
        ignoreNextEvent.current = false
      })

      socket.on('party:pause', (data) => {
        if (playerRef.current && !ignoreNextEvent.current) {
          console.log('Received pause command, syncing to:', data.timestamp)
          playerRef.current.currentTime(data.timestamp)
          playerRef.current.pause()
        }
        ignoreNextEvent.current = false
      })

      socket.on('party:seek', (data) => {
        if (playerRef.current && !ignoreNextEvent.current) {
          console.log('Received seek command, syncing to:', data.timestamp)
          playerRef.current.currentTime(data.timestamp)
        }
        ignoreNextEvent.current = false
      })

      // Sync event for new joiners
      socket.on('party:sync', (data) => {
        console.log('Received sync state:', data)
        setIsSyncing(true)
        if (playerRef.current) {
          playerRef.current.currentTime(data.timestamp)
          if (data.isPlaying) {
            playerRef.current.play()
          } else {
            playerRef.current.pause()
          }
        }
        setTimeout(() => setIsSyncing(false), 500)
      })

      // Host-only notification
      socket.on('party:host-only', (data) => {
        showToast(data.message, 'warning', 3000)
      })

      // Chat events
      socket.on('party:chat-message', (message) => {
        setMessages((prev) => [...prev, message])
      })

      socket.on('party:kicked', () => {
        showToast('You have been removed from the watch party', 'warning', 5000)
        setTimeout(() => {
          router.push('/')
        }, 100)
      })

      socket.on('party:ended', () => {
        showToast('Watch party has ended', 'info', 5000)
        router.push('/')
      })
    }

    initSocket()

    // Cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('party:leave', {
          roomCode,
          userId: getCurrentUserId(),
        })
        socketRef.current.disconnect()
      }
    }
  }, [roomCode, currentUser, watchParty.hostId, router, guestName, guestId])

  const handlePlayerReady = (player: Player) => {
    playerRef.current = player

    // Only attach control event listeners if host
    // Guests should not emit playback events
    if (isHost) {
      player.on('play', () => {
        if (!ignoreNextEvent.current && socketRef.current) {
          ignoreNextEvent.current = true
          socketRef.current.emit('party:play', {
            roomCode,
            timestamp: player.currentTime() || 0,
            userId: getCurrentUserId(),
          })
        }
      })

      player.on('pause', () => {
        if (!ignoreNextEvent.current && socketRef.current) {
          ignoreNextEvent.current = true
          socketRef.current.emit('party:pause', {
            roomCode,
            timestamp: player.currentTime() || 0,
            userId: getCurrentUserId(),
          })
        }
      })

      player.on('seeked', () => {
        if (!ignoreNextEvent.current && socketRef.current) {
          ignoreNextEvent.current = true
          socketRef.current.emit('party:seek', {
            roomCode,
            timestamp: player.currentTime() || 0,
            userId: getCurrentUserId(),
          })
        }
      })
    }
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || !socketRef.current) return

    // Require guests to have set a name before sending messages
    if (!currentUser && !guestName.trim()) {
      showToast('Please enter your name before sending messages', 'warning', 3000)
      return
    }

    socketRef.current.emit('party:chat-message', {
      roomCode,
      message: newMessage.trim(),
      userId: getCurrentUserId(),
      username: currentUser?.username || guestName || 'Guest',
      displayName: currentUser?.displayName || guestName || 'Guest',
    })

    setNewMessage('')
  }

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode)
    showToast('Room code copied to clipboard!', 'info', 2000)
  }

  const copyShareLink = () => {
    const url = `${window.location.origin}/party/join?code=${roomCode}`
    navigator.clipboard.writeText(url)
    showToast('Share link copied!', 'info', 2000)
  }

  const handleCloseParty = async () => {
    if (!confirm('Are you sure you want to close this watch party? All participants will be removed.')) {
      return
    }

    try {
      const response = await fetch(`/api/watch-party/${roomCode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      })

      if (response.ok) {
        showToast('Watch party closed', 'info', 3000)
        router.push('/')
      } else {
        const error = await response.json()
        showToast(`Error: ${error.error}`, 'error', 5000)
      }
    } catch (error) {
      console.error('Error closing watch party:', error)
      showToast('Failed to close watch party', 'error', 5000)
    }
  }

  const handleKickParticipant = async (participantUserId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('party:kick-participant', {
        roomCode,
        userId: participantUserId,
      })
    }

    // For authenticated users, also update the database
    if (!participantUserId.startsWith('guest-')) {
      await fetch(`/api/watch-party/${roomCode}/kick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: participantUserId }),
      })
    }
  }

  const requestSync = () => {
    if (socketRef.current) {
      socketRef.current.emit('party:request-sync', { roomCode })
      showToast('Syncing with host...', 'info', 2000)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-500/50 rounded-lg p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Watch Party</h1>
            <p className="text-gray-300">
              Watching: <span className="font-semibold">{watchParty.video.title}</span>
            </p>
            <p className="text-sm text-gray-400">
              Hosted by: {watchParty.host.displayName || watchParty.host.username}
            </p>
          </div>
          <div className="text-right space-y-3">
            <div>
              <p className="text-sm text-gray-400 mb-2">Room Code:</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-mono font-bold text-blue-400">{roomCode}</span>
                <button
                  onClick={copyRoomCode}
                  className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  title="Copy room code"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  onClick={copyShareLink}
                  className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  title="Copy share link"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <span className={`inline-flex items-center gap-1 text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></span>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
              {isHost ? (
                <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full font-medium">
                  You are the host
                </span>
              ) : (
                <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full font-medium">
                  Viewer
                </span>
              )}
            </div>
            {isHost && (
              <button
                onClick={handleCloseParty}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Close Party
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Player and Chat */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Player */}
          <div className="bg-gray-900 rounded-lg overflow-hidden relative">
            {isSyncing && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                <div className="text-white text-center">
                  <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-2" />
                  <p>Syncing...</p>
                </div>
              </div>
            )}
            <VideoPlayer
              src={`/api/videos/${watchParty.video.id}/stream`}
              poster={watchParty.video.thumbnailUrl || undefined}
              videoId={watchParty.video.id}
              onPlayerReady={handlePlayerReady}
            />
            {/* Show sync button for non-hosts */}
            {!isHost && (
              <div className="p-2 bg-gray-800 flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  Only the host can control playback
                </p>
                <button
                  onClick={requestSync}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                >
                  Sync with host
                </button>
              </div>
            )}
          </div>

          {/* Chat */}
          <div className="bg-gray-900 rounded-lg p-4">
            <h2 className="text-xl font-bold text-white mb-4">Chat</h2>

            {/* Messages */}
            <div className="h-80 overflow-y-auto mb-4 space-y-2 bg-gray-800 rounded-lg p-3">
              {messages.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No messages yet. Start the conversation!</p>
              ) : (
                <>
                  {messages.map((msg) => (
                    <div key={msg.id} className="bg-gray-700 rounded-lg p-3">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-semibold text-blue-400">{msg.displayName || msg.username}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-white">{msg.message}</p>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </>
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="space-y-2">
              {/* Guest name input */}
              {!isAuthenticated && (
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Enter your name..."
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              )}

              {/* Message input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  disabled={!isConnected}
                />
                <button
                  type="submit"
                  disabled={!isConnected || !newMessage.trim()}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Participants Sidebar */}
        <div className="bg-gray-900 rounded-lg p-4 h-fit lg:sticky lg:top-4">
          <h2 className="text-xl font-bold text-white mb-4">
            Participants ({participants.length})
          </h2>
          <div className="space-y-2">
            {participants.map((participant) => (
              <div
                key={participant.userId}
                className="flex items-center justify-between gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {(participant.displayName || participant.username || 'G')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">
                      {participant.displayName || participant.username}
                      {participant.isHost && (
                        <span className="ml-2 text-xs bg-blue-600 px-2 py-0.5 rounded">Host</span>
                      )}
                      {currentUser && participant.userId === currentUser.id && (
                        <span className="ml-2 text-xs bg-green-600 px-2 py-0.5 rounded">You</span>
                      )}
                    </p>
                    <p className="text-sm text-gray-400 truncate">@{participant.username}</p>
                  </div>
                </div>
                {isHost && !participant.isHost && participant.userId !== currentUser?.id && (
                  <button
                    onClick={() => handleKickParticipant(participant.userId)}
                    className="p-1.5 hover:bg-red-600/80 text-red-400 hover:text-white rounded transition-colors flex-shrink-0"
                    title="Remove participant"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
