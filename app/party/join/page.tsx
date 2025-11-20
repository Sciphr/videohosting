'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function JoinWatchPartyPage() {
  const router = useRouter()
  const [roomCode, setRoomCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState('')

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!roomCode.trim()) {
      setError('Please enter a room code')
      return
    }

    setIsJoining(true)

    try {
      // Check if watch party exists
      const res = await fetch(`/api/watch-party/${roomCode.trim().toUpperCase()}`)

      if (!res.ok) {
        if (res.status === 404) {
          setError('Watch party not found. Please check the room code.')
        } else if (res.status === 410) {
          setError('This watch party has ended.')
        } else {
          setError('Failed to join watch party. Please try again.')
        }
        return
      }

      // Join the watch party
      const joinRes = await fetch(`/api/watch-party/${roomCode.trim().toUpperCase()}/join`, {
        method: 'POST',
      })

      if (!joinRes.ok) {
        setError('Failed to join watch party. Please try again.')
        return
      }

      // Redirect to watch party
      router.push(`/party/${roomCode.trim().toUpperCase()}`)
    } catch (err) {
      console.error('Join watch party error:', err)
      setError('Failed to join watch party. Please try again.')
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="bg-gray-900 rounded-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Join Watch Party</h1>
          <p className="text-gray-400">Enter the room code to join your friends</p>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label htmlFor="roomCode" className="block text-sm font-medium text-gray-300 mb-2">
              Room Code
            </label>
            <input
              type="text"
              id="roomCode"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="Enter 8-character code"
              maxLength={8}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-center text-2xl font-mono tracking-wider placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 uppercase"
              disabled={isJoining}
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isJoining || !roomCode.trim()}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium text-lg transition-all"
          >
            {isJoining ? 'Joining...' : 'Join Watch Party'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm mb-2">Don't have a room code?</p>
          <Link
            href="/"
            className="text-blue-400 hover:text-blue-300 text-sm font-medium"
          >
            Browse videos to start a watch party
          </Link>
        </div>
      </div>
    </div>
  )
}
