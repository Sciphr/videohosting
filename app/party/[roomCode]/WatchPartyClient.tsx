'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { io, Socket } from 'socket.io-client'
import VideoPlayer from '@/components/VideoPlayer'
import Player from 'video.js/dist/types/player'
import type { ServerToClientEvents, ClientToServerEvents, Participant, ChatMessage } from '@/lib/socket'

interface WatchPartyClientProps {
  watchParty: any
  currentUser: {
    id: string
    username: string
    displayName: string
  }
}

export default function WatchPartyClient({ watchParty, currentUser }: WatchPartyClientProps) {
  const router = useRouter()
  const playerRef = useRef<Player | null>(null)
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null)
  const chatEndRef = useRef<HTMLDivElement | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isHost, setIsHost] = useState(false)
  const ignoreNextEvent = useRef(false)

  const roomCode = watchParty.roomCode

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    setIsHost(watchParty.hostId === currentUser.id)

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

        // Join the watch party room
        socket.emit('party:join', {
          roomCode,
          userId: currentUser.id,
          username: currentUser.username,
          displayName: currentUser.displayName,
        })
      })

      socket.on('disconnect', () => {
        console.log('Socket.io disconnected')
        setIsConnected(false)
      })

      // Participant events
      socket.on('party:user-joined', (data) => {
        console.log('User joined:', data.username)
      })

      socket.on('party:user-left', (data) => {
        console.log('User left:', data.username)
      })

      socket.on('party:participant-list', (data) => {
        setParticipants(data.participants)
      })

      // Synchronized playback events
      socket.on('party:play', (data) => {
        if (playerRef.current && !ignoreNextEvent.current) {
          playerRef.current.currentTime(data.timestamp)
          playerRef.current.play()
        }
        ignoreNextEvent.current = false
      })

      socket.on('party:pause', (data) => {
        if (playerRef.current && !ignoreNextEvent.current) {
          playerRef.current.currentTime(data.timestamp)
          playerRef.current.pause()
        }
        ignoreNextEvent.current = false
      })

      socket.on('party:seek', (data) => {
        if (playerRef.current && !ignoreNextEvent.current) {
          playerRef.current.currentTime(data.timestamp)
        }
        ignoreNextEvent.current = false
      })

      // Chat events
      socket.on('party:chat-message', (message) => {
        setMessages((prev) => [...prev, message])
      })

      socket.on('party:ended', () => {
        alert('Watch party has ended')
        router.push('/')
      })
    }

    initSocket()

    // Cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('party:leave', {
          roomCode,
          userId: currentUser.id,
        })
        socketRef.current.disconnect()
      }
    }
  }, [roomCode, currentUser, watchParty.hostId, router])

  const handlePlayerReady = (player: Player) => {
    playerRef.current = player

    // Attach event listeners for synchronized playback
    player.on('play', () => {
      if (!ignoreNextEvent.current && socketRef.current) {
        ignoreNextEvent.current = true
        socketRef.current.emit('party:play', {
          roomCode,
          timestamp: player.currentTime() || 0,
        })
      }
    })

    player.on('pause', () => {
      if (!ignoreNextEvent.current && socketRef.current) {
        ignoreNextEvent.current = true
        socketRef.current.emit('party:pause', {
          roomCode,
          timestamp: player.currentTime() || 0,
        })
      }
    })

    player.on('seeked', () => {
      if (!ignoreNextEvent.current && socketRef.current) {
        ignoreNextEvent.current = true
        socketRef.current.emit('party:seek', {
          roomCode,
          timestamp: player.currentTime() || 0,
        })
      }
    })
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || !socketRef.current) return

    socketRef.current.emit('party:chat-message', {
      roomCode,
      message: newMessage.trim(),
      userId: currentUser.id,
      username: currentUser.username,
      displayName: currentUser.displayName,
    })

    setNewMessage('')
  }

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode)
    alert('Room code copied to clipboard!')
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-500/50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Watch Party</h1>
            <p className="text-gray-300">
              Watching: <span className="font-semibold">{watchParty.video.title}</span>
            </p>
            <p className="text-sm text-gray-400">
              Hosted by: {watchParty.host.displayName || watchParty.host.username}
            </p>
          </div>
          <div className="text-right">
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
            </div>
            <div className="mt-2">
              <span className={`inline-flex items-center gap-1 text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></span>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Player and Chat */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Player */}
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <VideoPlayer
              src={watchParty.video.fileUrl}
              poster={watchParty.video.thumbnailUrl || undefined}
              videoId={watchParty.video.id}
              onPlayerReady={handlePlayerReady}
            />
          </div>

          {/* Chat */}
          <div className="bg-gray-900 rounded-lg p-4">
            <h2 className="text-xl font-bold text-white mb-4">Chat</h2>

            {/* Messages */}
            <div className="h-96 overflow-y-auto mb-4 space-y-2 bg-gray-800 rounded-lg p-3">
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
            <form onSubmit={handleSendMessage} className="flex gap-2">
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
                className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  {participant.displayName[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">
                    {participant.displayName}
                    {participant.userId === watchParty.hostId && (
                      <span className="ml-2 text-xs bg-blue-600 px-2 py-0.5 rounded">Host</span>
                    )}
                    {participant.userId === currentUser.id && (
                      <span className="ml-2 text-xs bg-green-600 px-2 py-0.5 rounded">You</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-400 truncate">@{participant.username}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
