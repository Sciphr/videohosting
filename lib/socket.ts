import { Server as NetServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { NextApiResponse } from 'next'

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: SocketIOServer
    }
  }
}

// Socket.io event types
export interface ServerToClientEvents {
  'party:user-joined': (data: { userId: string; username: string; displayName: string }) => void
  'party:user-left': (data: { userId: string; username: string }) => void
  'party:participant-list': (data: { participants: Participant[] }) => void
  'party:play': (data: { timestamp: number }) => void
  'party:pause': (data: { timestamp: number }) => void
  'party:seek': (data: { timestamp: number }) => void
  'party:chat-message': (data: ChatMessage) => void
  'party:ended': () => void
}

export interface ClientToServerEvents {
  'party:join': (data: { roomCode: string; userId: string; username: string; displayName: string }) => void
  'party:leave': (data: { roomCode: string; userId: string }) => void
  'party:play': (data: { roomCode: string; timestamp: number }) => void
  'party:pause': (data: { roomCode: string; timestamp: number }) => void
  'party:seek': (data: { roomCode: string; timestamp: number }) => void
  'party:chat-message': (data: { roomCode: string; message: string; userId: string; username: string; displayName: string }) => void
}

export interface Participant {
  userId: string
  username: string
  displayName: string
  joinedAt: string
}

export interface ChatMessage {
  id: string
  userId: string
  username: string
  displayName: string
  message: string
  timestamp: string
}

// Store for room participants (in-memory for now)
// In production, use Redis or similar
export const roomParticipants = new Map<string, Map<string, Participant>>()
