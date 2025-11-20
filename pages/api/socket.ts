import { NextApiRequest } from 'next'
import { Server as SocketIOServer } from 'socket.io'
import type {
  NextApiResponseServerIO,
  ServerToClientEvents,
  ClientToServerEvents,
  roomParticipants,
  Participant,
  ChatMessage
} from '@/lib/socket'

export default function SocketHandler(
  req: NextApiRequest,
  res: NextApiResponseServerIO
) {
  if (res.socket.server.io) {
    console.log('Socket.io already running')
    res.end()
    return
  }

  console.log('Initializing Socket.io server...')

  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(
    res.socket.server as any,
    {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
      },
    }
  )

  res.socket.server.io = io

  // In-memory storage for room participants
  const participants = new Map<string, Map<string, Participant>>()

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    // Join a watch party room
    socket.on('party:join', ({ roomCode, userId, username, displayName }) => {
      console.log(`User ${username} joining room ${roomCode}`)

      socket.join(roomCode)

      // Add participant to room
      if (!participants.has(roomCode)) {
        participants.set(roomCode, new Map())
      }
      const roomParticipants = participants.get(roomCode)!
      roomParticipants.set(userId, { userId, username, displayName, joinedAt: new Date().toISOString() })

      // Notify others in room
      socket.to(roomCode).emit('party:user-joined', { userId, username, displayName })

      // Send current participant list to the joining user
      socket.emit('party:participant-list', {
        participants: Array.from(roomParticipants.values())
      })

      // Send participant list to all users in room
      io.to(roomCode).emit('party:participant-list', {
        participants: Array.from(roomParticipants.values())
      })
    })

    // Leave a watch party room
    socket.on('party:leave', ({ roomCode, userId }) => {
      console.log(`User ${userId} leaving room ${roomCode}`)

      const roomParticipants = participants.get(roomCode)
      const participant = roomParticipants?.get(userId)

      if (roomParticipants) {
        roomParticipants.delete(userId)

        // If room is empty, delete it
        if (roomParticipants.size === 0) {
          participants.delete(roomCode)
        } else {
          // Notify others
          socket.to(roomCode).emit('party:user-left', {
            userId,
            username: participant?.username || 'Unknown'
          })

          // Update participant list
          io.to(roomCode).emit('party:participant-list', {
            participants: Array.from(roomParticipants.values())
          })
        }
      }

      socket.leave(roomCode)
    })

    // Synchronized playback events
    socket.on('party:play', ({ roomCode, timestamp }) => {
      console.log(`Play event in room ${roomCode} at ${timestamp}`)
      socket.to(roomCode).emit('party:play', { timestamp })
    })

    socket.on('party:pause', ({ roomCode, timestamp }) => {
      console.log(`Pause event in room ${roomCode} at ${timestamp}`)
      socket.to(roomCode).emit('party:pause', { timestamp })
    })

    socket.on('party:seek', ({ roomCode, timestamp }) => {
      console.log(`Seek event in room ${roomCode} to ${timestamp}`)
      socket.to(roomCode).emit('party:seek', { timestamp })
    })

    // Chat messages
    socket.on('party:chat-message', ({ roomCode, message, userId, username, displayName }) => {
      console.log(`Chat message in room ${roomCode} from ${username}: ${message}`)

      const chatMessage: ChatMessage = {
        id: `${Date.now()}-${userId}`,
        userId,
        username,
        displayName,
        message,
        timestamp: new Date().toISOString()
      }

      // Broadcast to all users in room (including sender)
      io.to(roomCode).emit('party:chat-message', chatMessage)
    })

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)

      // Clean up participant from all rooms
      participants.forEach((roomParticipants, roomCode) => {
        roomParticipants.forEach((participant, userId) => {
          // Note: We can't reliably map socket.id to userId without additional tracking
          // In production, maintain a socket.id -> userId mapping
        })
      })
    })
  })

  console.log('Socket.io server initialized')
  res.end()
}
