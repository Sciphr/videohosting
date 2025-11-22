import { NextApiRequest } from 'next'
import { Server as SocketIOServer } from 'socket.io'
import type {
  NextApiResponseServerIO,
  ServerToClientEvents,
  ClientToServerEvents,
  Participant,
  ChatMessage,
  RoomState
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
  // Track userId to socketId mapping
  const userToSocket = new Map<string, string>()
  // Track room state (host, playback position, etc.)
  const roomStates = new Map<string, RoomState>()

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    // Join a watch party room
    socket.on('party:join', ({ roomCode, userId, username, displayName, isHost }) => {
      console.log(`User ${username} joining room ${roomCode} (isHost: ${isHost})`)

      socket.join(roomCode)
      userToSocket.set(userId, socket.id)

      // Add participant to room
      if (!participants.has(roomCode)) {
        participants.set(roomCode, new Map())
      }
      const roomParticipants = participants.get(roomCode)!
      roomParticipants.set(userId, {
        userId,
        username,
        displayName,
        joinedAt: new Date().toISOString(),
        isHost
      })

      // Initialize or update room state if host
      if (isHost) {
        if (!roomStates.has(roomCode)) {
          roomStates.set(roomCode, {
            hostId: userId,
            currentTime: 0,
            isPlaying: false
          })
        } else {
          // Update host ID in case it changed
          const state = roomStates.get(roomCode)!
          state.hostId = userId
        }
      }

      // Notify others in room
      socket.to(roomCode).emit('party:user-joined', { userId, username, displayName })

      // Send current participant list to all
      io.to(roomCode).emit('party:participant-list', {
        participants: Array.from(roomParticipants.values())
      })

      // If not host, send current sync state so they start at the right position
      if (!isHost && roomStates.has(roomCode)) {
        const state = roomStates.get(roomCode)!
        console.log(`Sending sync state to new joiner: time=${state.currentTime}, playing=${state.isPlaying}`)
        socket.emit('party:sync', {
          timestamp: state.currentTime,
          isPlaying: state.isPlaying
        })
      }
    })

    // Leave a watch party room
    socket.on('party:leave', ({ roomCode, userId }) => {
      console.log(`User ${userId} leaving room ${roomCode}`)

      const roomParticipants = participants.get(roomCode)
      const participant = roomParticipants?.get(userId)

      if (roomParticipants) {
        roomParticipants.delete(userId)
        userToSocket.delete(userId)

        // If room is empty, delete it and its state
        if (roomParticipants.size === 0) {
          participants.delete(roomCode)
          roomStates.delete(roomCode)
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

    // Synchronized playback events - HOST ONLY
    socket.on('party:play', ({ roomCode, timestamp, userId }) => {
      const state = roomStates.get(roomCode)

      // Only allow host to control playback
      if (state && state.hostId === userId) {
        console.log(`[HOST] Play event in room ${roomCode} at ${timestamp}`)
        state.currentTime = timestamp
        state.isPlaying = true
        socket.to(roomCode).emit('party:play', { timestamp })
      } else {
        console.log(`[BLOCKED] Non-host ${userId} tried to play in room ${roomCode}`)
        // Notify the user they can't control playback
        socket.emit('party:host-only', { message: 'Only the host can control playback' })
        // Re-sync them to current state
        if (state) {
          socket.emit('party:sync', {
            timestamp: state.currentTime,
            isPlaying: state.isPlaying
          })
        }
      }
    })

    socket.on('party:pause', ({ roomCode, timestamp, userId }) => {
      const state = roomStates.get(roomCode)

      // Only allow host to control playback
      if (state && state.hostId === userId) {
        console.log(`[HOST] Pause event in room ${roomCode} at ${timestamp}`)
        state.currentTime = timestamp
        state.isPlaying = false
        socket.to(roomCode).emit('party:pause', { timestamp })
      } else {
        console.log(`[BLOCKED] Non-host ${userId} tried to pause in room ${roomCode}`)
        socket.emit('party:host-only', { message: 'Only the host can control playback' })
        if (state) {
          socket.emit('party:sync', {
            timestamp: state.currentTime,
            isPlaying: state.isPlaying
          })
        }
      }
    })

    socket.on('party:seek', ({ roomCode, timestamp, userId }) => {
      const state = roomStates.get(roomCode)

      // Only allow host to control playback
      if (state && state.hostId === userId) {
        console.log(`[HOST] Seek event in room ${roomCode} to ${timestamp}`)
        state.currentTime = timestamp
        socket.to(roomCode).emit('party:seek', { timestamp })
      } else {
        console.log(`[BLOCKED] Non-host ${userId} tried to seek in room ${roomCode}`)
        socket.emit('party:host-only', { message: 'Only the host can control playback' })
        if (state) {
          socket.emit('party:sync', {
            timestamp: state.currentTime,
            isPlaying: state.isPlaying
          })
        }
      }
    })

    // Request sync (for when guests need to re-sync)
    socket.on('party:request-sync', ({ roomCode }) => {
      const state = roomStates.get(roomCode)
      if (state) {
        socket.emit('party:sync', {
          timestamp: state.currentTime,
          isPlaying: state.isPlaying
        })
      }
    })

    // Chat messages - everyone can send
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

    // Kick participant from room - HOST ONLY
    socket.on('party:kick-participant', ({ roomCode, userId }) => {
      console.log(`Kicking user ${userId} from room ${roomCode}`)

      const roomParticipants = participants.get(roomCode)
      const participant = roomParticipants?.get(userId)

      if (roomParticipants && participant) {
        roomParticipants.delete(userId)

        // Update participant list for remaining users
        io.to(roomCode).emit('party:participant-list', {
          participants: Array.from(roomParticipants.values())
        })

        // Send kick notification to the kicked participant
        const kickedSocketId = userToSocket.get(userId)
        if (kickedSocketId) {
          io.to(kickedSocketId).emit('party:kicked', {})
          userToSocket.delete(userId)
        }
      }
    })

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)

      // Find and remove the user from their room
      // We need to find which userId this socket belongs to
      for (const [usrId, sockId] of userToSocket.entries()) {
        if (sockId === socket.id) {
          // Found the user, now find their room
          for (const [roomCode, roomParticipants] of participants.entries()) {
            if (roomParticipants.has(usrId)) {
              const participant = roomParticipants.get(usrId)
              roomParticipants.delete(usrId)
              userToSocket.delete(usrId)

              if (roomParticipants.size === 0) {
                participants.delete(roomCode)
                roomStates.delete(roomCode)
              } else {
                io.to(roomCode).emit('party:user-left', {
                  userId: usrId,
                  username: participant?.username || 'Unknown'
                })
                io.to(roomCode).emit('party:participant-list', {
                  participants: Array.from(roomParticipants.values())
                })
              }
              break
            }
          }
          break
        }
      }
    })
  })

  console.log('Socket.io server initialized')
  res.end()
}
