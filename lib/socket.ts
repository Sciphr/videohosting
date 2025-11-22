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
  'party:sync': (data: { timestamp: number; isPlaying: boolean }) => void // Sync state for new joiners
  'party:chat-message': (data: ChatMessage) => void
  'party:kicked': (data: {}) => void
  'party:ended': () => void
  'party:host-only': (data: { message: string }) => void // Notify non-hosts they can't control
}

export interface ClientToServerEvents {
  'party:join': (data: { roomCode: string; userId: string; username: string; displayName: string; isHost: boolean }) => void
  'party:leave': (data: { roomCode: string; userId: string }) => void
  'party:play': (data: { roomCode: string; timestamp: number; userId: string }) => void
  'party:pause': (data: { roomCode: string; timestamp: number; userId: string }) => void
  'party:seek': (data: { roomCode: string; timestamp: number; userId: string }) => void
  'party:request-sync': (data: { roomCode: string }) => void // Request current state from host
  'party:chat-message': (data: { roomCode: string; message: string; userId: string; username: string; displayName: string }) => void
  'party:kick-participant': (data: { roomCode: string; userId: string }) => void
}

export interface Participant {
  userId: string
  username: string
  displayName: string
  joinedAt: string
  isHost: boolean
}

// Room state for tracking playback
export interface RoomState {
  hostId: string
  currentTime: number
  isPlaying: boolean
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
